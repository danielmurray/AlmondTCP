module("luci.coroutine", package.seeall)

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

function Queuer(subCoroutine)
  
----------  private fields & methods ----------
  local queue = 0
  local subRoutine = coroutine.create(subCoroutine)

  local function subCoroutineWrapper (...)
    printy('start')
    while (true) do
      result = coroutine.resume(subRoutine, ...)
      printy('just finished, queue is ', queue)
      while (queue > 0) do
        printy(coroutine.running())
        coroutine.yield(result)
      end
    end
    printy('end')
  end

  local superRoutine = coroutine.create(subCoroutineWrapper)


---------- public fields & methods ---------- 
  
  local self = {}
  
  function self.resume(...)
    queue = queue + 1
    return coroutine.resume(superRoutine, ...)
  end

  -- return the instance
  return self
end