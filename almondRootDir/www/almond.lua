module("luci.driver", package.seeall)

local function Driver(execDir)
  
----------  private fields & methods ---------- 
  local setDeviceExecDir = execDir

  local function stringify(t, s)
    return table.concat(t,s)
  end

  local function stringifyArgs(args)
    argTable = {}
    for key, value in pairs(args) do
        keyValuePair = key .. "=" .. tostring(value)
        table.insert(argTable, keyValuePair)
    end
    return stringify(argTable, ' ')
  end

  local function execute(command)
    local handle = io.popen(command)
    local result = handle:read("*a")
    handle:close()
    return result
  end


---------- public fields & methods ---------- 
  local self = {
    test = 1
  }

  function self.getSet(cmd, dev, idx, val)
    local args = {}
    args['cmd'] = cmd
    args['dev'] = dev
    args['idx'] = idx
    args['val'] = val

    argString = stringifyArgs(args)
    return execute(setDeviceExecDir .. " " .. argString)
  end


  -- return the instance
  return self
end

local function Almond()
  
----------  private fields & methods ---------- 
  local driver = Driver("/www/setdevice")

  
  

  


---------- public fields & methods ---------- 
  local self = {
    test = 1
  }

  function self.getSet(cmd, dev, idx, val)
    local args = {}
    args['cmd'] = cmd
    args['dev'] = dev
    args['idx'] = idx
    args['val'] = val

    argString = stringifyArgs(args)
    return execute(setDeviceExecDir .. " " .. argString)
  end


  -- return the instance
  return self
end
