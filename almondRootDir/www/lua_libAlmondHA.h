enum RET_CODE {SUCC = 0, FAIL = 1, RETRY= 2};

//See http://stackoverflow.com/questions/13000347/using-c-struct-in-c
struct lua_DeviceChangeNotification
{
  int DeviceId;
  int LastNotificationIndex;
  char LastNotificationValue[25];
};

struct lua_DeviceValue
{
  //All the char[] had better be \0 terminated so they can be treated
  //normally as strings and used with strcpy-style functions
  int index;
  char name[30];
  char value[25];
  char *possible_values;
  char *range_min, *range_max;
  char *data_type;
};

struct lua_DeviceListEntry
{
  //All the char[] arrays are \0 terminated so they can be treated as
  //strings and used with strcpy-style functions. The fields are a
  //direct translation from class Device private members.

  int DeviceId;
  char Name[180];
  char Location[180];
  char AssociationTimeStamp[32];
  int /*enum DevType*/ Type;
  char FriendlyDeviceType[32];

  //char DeviceType[32];
  //int OZWNode;
  //int ZigBeeShortID;
  //char ZigBeeEUI64[25];
  //int (enum DevTech) DeviceTechnology;
  //bool AllowNotification;

  int ValueCount; //# of indexes
  struct lua_DeviceValue *DeviceValues;
};

#ifdef __cplusplus
  std::string getDeviceList_as_json();
  extern "C" {
    int lua_getDeviceList(struct lua_DeviceListEntry **);
    int lua_getDeviceVal(int dev, int idx, char *rval);
    int lua_getDeviceProperty(int dev, const char *prop, char *val);
    int lua_setDeviceValAsync(int dev, int idx, const char *val);
    int lua_setDevicePropertyAsync(int dev, const char *prop, const char *val,const char *prop1, const char *val1);
    int lua_setDeviceValSyncWithTimeout(int dev, int idx, const char *val, int timeout);
  }
#else
  extern int lua_getDeviceList(struct lua_DeviceListEntry **);
  extern int lua_getDeviceVal(int dev, int idx, char *rval);
  extern int lua_getDeviceProperty(int dev, const char *prop, char *val);
  extern int lua_setDeviceValAsync(int dev, int idx, const char *val);
  extern int lua_setDevicePropertyAsync(int dev, const char *prop, const char *val,const char *prop1, const char *val1);
  extern int lua_setDeviceValSyncWithTimeout(int dev, int idx, const char *val, int timeout);
#endif
