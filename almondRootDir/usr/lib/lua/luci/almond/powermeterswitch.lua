module("luci.almond.powermeterswitch", package.seeall)

local function printy(...)
  printResult = ""
  for i,v in ipairs(arg) do
    printResult = printResult .. tostring(v) .. "\t"
  end
  os.execute("echo " ..printResult .. " > /dev/pts/0")
end

local function printytable(t)
  for k,v in pairs(t) do
    printy(k,v)
  end
end

function PowerMeterSwitch(tooMuchData)
  
----------  private fields & methods ---------- 
  local setDeviceExecDir = execDir
  local switch = tooMuchData[1]

  local rmspow = tooMuchData[12].value
  local powmulti = tooMuchData[5].value
  local powdiv = tooMuchData[4].value

  local rmscurr = tooMuchData[10].value
  local currmulti = tooMuchData[9].value
  local currdiv = tooMuchData[8].value

  local rmsvolt = tooMuchData[11].value
  local voltmulti = tooMuchData[7].value
  local voltdiv = tooMuchData[6].value

  local rmsfreq = tooMuchData[13].value
  local freqmulti = tooMuchData[3].value
  local freqdiv = tooMuchData[2].value

  local valueArray = {}
  power = {
    index = 2,
    name = 'power',
    value = powmulti*rmspow/powdiv
  }
  current = {
    index = 3,
    name = 'current',
    value = currmulti*rmscurr/currdiv
  }
  voltage = {
    index = 4,
    name = 'voltage',
    value = voltmulti*rmsvolt/voltdiv
  }
  frequency = {
    index = 5,
    name = 'frequency',
    value = freqmulti*rmsfreq/freqdiv
  }

  table.insert(valueArray,switch)
  table.insert(valueArray,power)
  table.insert(valueArray,current)
  table.insert(valueArray,voltage)
  table.insert(valueArray,frequency)
  
---------- public fields & methods ---------- 
  local self = {
    test = 1
  }

  function self.getValueArray()
    return valueArray
  end

  -- return the instance
  return self
end