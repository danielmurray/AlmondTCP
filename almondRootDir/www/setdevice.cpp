#include <stdio.h>
#include <stdlib.h> 
#include <unistd.h> //chdir
#include <iostream>
#include <string>
#include <sstream>
#include <map>
#include "lua_libAlmondHA.h"

static std::string CMD("cmd"), DEV("dev"), IDX("idx"), TIMEOUT("timeout"),
  VALUE("val"), NAME("name"), LOCATION("location"), PROP("prop");

std::string get_code(int c)
{
  std::stringstream ss;
  ss << "\"" << "code" << "\": ";
  ss << c;
  return ss.str();
}

std::string get_value(std::string &v)
{
  std::stringstream ss;
  ss << "\"" << "value" << "\": ";
  ss << "\"" << v << "\"";
  return ss.str();
}

std::string gen_retcode(int r, const char *buf)
{
  std::stringstream ss;

  if(r == SUCC) {
    std::string val(buf);
    ss << "{" << get_code(SUCC) << ", " << get_value(val) << "}";
  } else if(r == FAIL) {
    ss << "{" << get_code(FAIL) << "}";
  }
  return ss.str();
}

int main(int argc, char **argv)
{
  std::string::size_type n;
  std::map<std::string, std::string> hash;

  chdir("/");

  for(int i = 1; i < argc; i++)
  {
    std::string s(argv[i]);
    n = s.find("=");
    if(n == std::string::npos)
      continue;

    std::string key = s.substr(0, n);
    std::string val = s.substr(n+1);
    hash[key] = val;
  }

  if(hash[CMD] == "get")
  {
    char buf[64];
    int dev=0, idx = 0, r;

    if(hash[DEV] != "")
      dev = (int) strtol(hash[DEV].c_str(), NULL, 10);
    if(hash[IDX] != "")
      idx = (int) strtol(hash[IDX].c_str(), NULL, 10);

    if(hash[PROP] != "") {
      //cmd=get prop=name, or prop=location
      r = lua_getDeviceProperty(dev, hash[PROP].c_str(), buf);
      std::cout << gen_retcode(r, buf);
    } else {
      //cmd=get dev=6 idx=1
      r = lua_getDeviceVal(dev, idx, buf);
      std::cout << gen_retcode(r, buf);
    }

    return(0);
  }

  if(hash[CMD] == "set")
  {
    std::string val;
    int r, dev = 0, idx = 0, timeout = 0;

    if(hash[DEV] != "")
      dev = (int) strtol(hash[DEV].c_str(), NULL, 10);
    if(hash[IDX] != "")
      idx = (int) strtol(hash[IDX].c_str(), NULL, 10);
    if(hash[TIMEOUT] != "")
      timeout = (int) strtol(hash[TIMEOUT].c_str(), NULL, 10);
    if(hash[VALUE] != "")
      val = hash[VALUE];
    
    if(hash[NAME] != "") {
      //cmd=set prop=name val=NewName
      r = lua_setDevicePropertyAsync(dev, NAME.c_str(), hash[NAME].c_str(),LOCATION.c_str(), hash[LOCATION].c_str());
//      fprintf(stdout,"name\n");
    }
//    else if(hash[LOCATION] != "") {
//      //cmd=set prop=location val=NewLoc
//         r = lua_setDevicePropertyAsync(dev, LOCATION.c_str(), hash[LOCATION].c_str());
////      r = lua_setDevicePropertyAsync(dev, LOCATION.c_str(), hash[NAME].c_str());
//    }
    else {
      //cmd=set dev=6 idx=1 val=newval timeout=2000
    if(timeout == 0)
      r = lua_setDeviceValAsync(dev, idx, val.c_str());
    else
      r = lua_setDeviceValSyncWithTimeout(dev, idx, val.c_str(), timeout);
    }

    std::cout << "{" << get_code(r) << "}";
    return(0);
  }

  if(hash[CMD] == "list")
  {
    std::cout << getDeviceList_as_json();
    return(0);
  }

  std::cout << "{" << get_code(FAIL) << "}";
  return(0);
}
