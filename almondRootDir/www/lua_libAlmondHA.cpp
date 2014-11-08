#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <stdio.h>
#include <time.h>
#include <sys/time.h>
#include <pthread.h>
#include <sstream>
#include "libAlmondHA.h"
#include "lua_libAlmondHA.h"

/* lua_setDeviceValSyncWithTimeout is non-reentrant! That is, while
  one caller has invoked this function but not returned from it,
  another caller shouldn't call it.  It's intended to be called from
  Lua which is single threaded so re-entrancy should not be an
  issue. The function blocks the caller until a notification from
  libAlmondHA signals that the device-index pair (dv, id) has the
  value v, or a timeout occurs, whichever is earlier.

  All callbacks from libAlmondHA are shunted into theCallback().
*/

//Used to create monitors for externally exposed functions.
static pthread_mutex_t mutex;

//When calling lua_setDeviceValSyncWithTimeout(), wait on this
//condition variable awaiting timeout or device notification of
//success.
static pthread_cond_t cv_mutex;
enum WAKER {WAKER_NONE = 0, WAKER_TIMER = 1, WAKER_LIBALMOND = 2};

static const std::string APOS("\"");
static const std::string LBRACE("{");
static const std::string RBRACE("}");
static const std::string COMMA(",");
static const std::string COLON(":");

//Indicates whether someone is inside an unfinished call to
//lua_setDeviceValSyncWithTimeout().
static bool is_active = false;
static int dev, idx;
static char val[64];
static ulong req_num = 0;
static int waker = WAKER_NONE;

static void theCallback(Device *p)
{
  pthread_mutex_lock(&mutex);

  if(is_active)
  {
    if(p->getID() == dev && strncmp(val, p->getValue(idx), sizeof(val)) == 0)
    {
      waker = WAKER_LIBALMOND;
      pthread_cond_signal(&cv_mutex);
    }
  }

  pthread_mutex_unlock(&mutex);
}

/* Ideally, HADevices::initialize() should return an error because it
   does fail some times. And that error should be propagated up the
   call chain from init_haserver(). */
static void init_haserver()
{
  static int haserver_initialize_called = 0;
  if(!haserver_initialize_called)
  {
    HADevices::luaInitialize();
    HADevices::genericCallback(theCallback);
    haserver_initialize_called = 1;
  }
}

static int setValue(int dev, int idx, const char *val)
{
  if(dev <= 0 || idx <= 0 || strlen(val) == 0) {
    return(FAIL);
  }

  try
  {
    //call libAlmond's setValue
    Device d(dev);
    if(idx > d.getValueCount()) {
      return FAIL;
    } else {
      char val_buf[64];
      strncpy(val_buf, val, 64);
      d.setValue(idx, val_buf);
      return SUCC;
    }
  }
  catch(int idx)
  {
    return FAIL;
  }
}

int lua_setDevicePropertyAsync(int dev, const char *prop, const char *val,const char *prop1, const char *val1)
{
  pthread_mutex_lock(&mutex);
  init_haserver();

  std::string property(prop), value(val);

  std::string property1(prop1), value1(val1);
  if(dev <= 0 || (property != "name" && property != "location") || value.length() == 0) {
    pthread_mutex_unlock(&mutex);
    return(FAIL);
  }

  int r = SUCC;
  try
  {
    Device d(dev);
    char val_buf[64],val_buf1[64];
    strncpy(val_buf, val, 64);
    strncpy(val_buf1,val1,64);

      d.setName(val_buf);
    d.setLocation(val_buf1);
//    if(property == "location")
//      d.setLocation(val_buf);
//    else if(property == "name")
//      d.setName(val_buf);

    r = SUCC;
  }
  catch(int idx)
  {
    r = FAIL;
  }

  pthread_mutex_unlock(&mutex);
  return(r);
}

int lua_getDeviceProperty(int dev, const char *prop, char *val)
{
  pthread_mutex_lock(&mutex);
  init_haserver();

  std::string property(prop);

  if(dev <= 0 || (property != "name" && property != "location")) {
    pthread_mutex_unlock(&mutex);
    return(FAIL);
  }

  int r = SUCC;
  try
  {
    Device d(dev);

    if(property == "location")
      strcpy(val, d.getDeviceLocation());
    else if(property == "name")
      strcpy(val, d.getDeviceName());

    r = SUCC;
  }
  catch(int idx)
  {
    r = FAIL;
  }

  pthread_mutex_unlock(&mutex);
  return(r);
}

int lua_getDeviceVal(int dev, int idx, char *rval)
{
  pthread_mutex_lock(&mutex);
  init_haserver();
  int ret;

  if(dev <= 0 || idx <= 0) {
    return(FAIL);
  }

  //the (char *) returned by d.getValue(...) is valid only as long as
  //Device (d) is in scope.
  try
  {
    Device d(dev);
    if(idx > d.getValueCount()) {
      ret = FAIL;
    } else {
      char *val = d.getValue(idx);
      strcpy(rval, val);
      ret = SUCC;
    }
  }
  catch(int idx)
  {
    ret = FAIL;
  }

  pthread_mutex_unlock(&mutex);
  return ret;
}

int lua_setDeviceValAsync(int dev, int idx, const char *val)
{
  pthread_mutex_lock(&mutex);
  init_haserver();

  int ret = setValue(dev, idx, val);
  pthread_mutex_unlock(&mutex);
  return ret;
}

//timeout is in milliseconds.
int lua_setDeviceValSyncWithTimeout(int dv, int id, const char *v, int timeout)
{
  pthread_mutex_lock(&mutex);
  init_haserver();

  if(is_active) {
    /* It'd be nice to permit concurrent callers by holding them on
       another condition variable. For now, I simply return the caller
       with an error. */
    pthread_mutex_unlock(&mutex);
    return RETRY;
  }

  //start the action and wait for completion or timeout
  int r = setValue(dv, id, v);
  if(r != SUCC) {
    return r;
  }

  dev = dv;
  idx = id;
  strncpy(val, v, sizeof(val));
  req_num++;
  waker = WAKER_NONE;
  is_active = true;

  struct timespec timeToWait;
  struct timeval now;
  gettimeofday(&now, NULL);

  timeToWait.tv_sec = now.tv_sec + timeout/1000;
  timeToWait.tv_nsec = (now.tv_usec + (timeout % 1000) * 1000) * 1000;
  pthread_cond_timedwait(&cv_mutex, &mutex, &timeToWait);

  r = 1; //timed out
  if(waker == WAKER_LIBALMOND)
    r = 0; //set succeeded

  is_active = false;
  pthread_mutex_unlock(&mutex);
  return r;
}

struct lua_DeviceListEntry *getLuaDeviceEntry(struct lua_DeviceListEntry *p, Device &d)
{
  p->DeviceId = d.getID();
  strncpy(p->Name, d.getDeviceName(), sizeof(p->Name));
  strncpy(p->Location, d.getDeviceLocation(), sizeof(p->Location));
  //memcpy(p->AssociationTimeStamp, d.AssociationTimeStamp, sizeof(d.AssociationTimeStamp));
  p->Type = d.getDeviceType();
  strncpy(p->FriendlyDeviceType, d.getFriendlyDeviceType(), sizeof(p->FriendlyDeviceType));
  p->ValueCount = d.getValueCount();
  p->DeviceValues = (struct lua_DeviceValue *) calloc(p->ValueCount, sizeof(struct lua_DeviceValue));
  for(int i = 0; i < p->ValueCount; i++)
  {
    int index = i+1;
    p->DeviceValues[i].index = index;
    //printf("d.getValueName(...) = %s, d.getValue(...)=%s.\n", d.getValueName(index), d.getValue(index));
    strncpy(p->DeviceValues[i].name, d.getValueName(index), sizeof(p->DeviceValues[i].name));
    strncpy(p->DeviceValues[i].value, d.getValue(index), sizeof(p->DeviceValues[i].value));
  }

  return p;
}

std::string getLuaDeviceEntry_as_json(Device &d)
{
  std::stringstream ss;
  ss << LBRACE;
  
  ss << APOS << "Name" << APOS << COLON << APOS << d.getDeviceName() << APOS;
  ss << COMMA << APOS << "FriendlyDeviceType" << APOS << COLON <<
    APOS << d.getFriendlyDeviceType() << APOS;
  ss << COMMA << APOS << "DeviceType" << APOS << COLON <<
    APOS << d.getDeviceType() << APOS;

ss << COMMA << APOS << "DeviceID" << APOS << COLON <<
    APOS << d.getID() << APOS;
  std::string location(d.getDeviceLocation());
  if(location == "<NO_TAG>")
    location = "?";
  ss << COMMA << APOS << "Location" << APOS << COLON <<
    APOS << location << APOS;

  ss << COMMA << APOS << "DeviceValues" << APOS << COLON;
  int idx_cnt = d.getValueCount();

  ss << LBRACE;
  for(int i = 0; i < idx_cnt; i++)
  {
    if(i > 0) ss << COMMA;

    int index = i+1;
    ss << APOS << index << APOS << COLON;

    ss << LBRACE;
        ss << APOS << "index" << APOS << COLON <<
      APOS << index << APOS << COMMA;
    ss << APOS << "name" << APOS << COLON <<
      APOS << d.getValueName(index) << APOS << COMMA;
    ss << APOS << "value" << APOS << COLON <<
      APOS << d.getValue(index) << APOS;
    ss << RBRACE;
  }
  ss << RBRACE;

  ss << RBRACE;
  return ss.str();
}

/**
   lua_getDeviceList: Return a complete description of ZB/ZW devices
   and its current values. Intended to be called by C programs.

   The function is declared extern "C" so that the C++ compiler
   doesn't mangle its name, and it can therefore be called from both C
   and C++ code. The function was originally written to be called by
   Lua. It's intended to completely hide libAlmondHA from the caller,
   so no extra initialization should be done if calling from C++ code.
   In particular HADevices::initialize() shouldn't have been
   called. If the function is called from C code, then the caller
   cannot have called HADevices::initialize().

   @dlist: the device description is returned in *dlist.
   @return: count of the # of devices.
*/
int lua_getDeviceList(struct lua_DeviceListEntry **dlist)
{
  pthread_mutex_lock(&mutex);
  init_haserver();

  DeviceList dl;
  dl.Populate();

  int cnt = dl.devices.size();
  struct lua_DeviceListEntry *d_list = 
    (struct lua_DeviceListEntry *) calloc(cnt, sizeof(struct lua_DeviceListEntry));
  *dlist = d_list;

  list<Device>::iterator it;
  int i = 0;
  for (it = dl.devices.begin(); it != dl.devices.end(); ++it) {
    //printf("Name: %s\n", (*it).getDeviceName());
    getLuaDeviceEntry(d_list+i, *it);
    i++;
  }

  pthread_mutex_unlock(&mutex);
  return(cnt);
}

std::string getDeviceList_as_json()
{
  std::stringstream ss;
  DeviceList dl;

  pthread_mutex_lock(&mutex);
  init_haserver();
  dl.Populate();
  pthread_mutex_unlock(&mutex);  

  list<Device>::iterator it;
  int i;
  ss << LBRACE;

  for (i = 0, it = dl.devices.begin(); it != dl.devices.end(); ++it, ++i) {
    std::string dev_str = getLuaDeviceEntry_as_json(*it);
    if(i > 0) ss << COMMA;
    ss << APOS << it->getID() << APOS << COLON << dev_str;
  }

  ss << RBRACE;
  return(ss.str());
}
