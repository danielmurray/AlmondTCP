module("luci.almond.users", package.seeall)

require "luci.json"
require("uci")

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

local function Driver(userFile)
  
----------  private fields & methods ---------- 
	local userFile = userFile

	local function read()
		local f = io.open(userFile, "r")
		local content = f:read("*all")
		f:close()
		return tostring(content)
	end

	local function write(content)
		local f = io.open(userFile, "w")
		f:write(content)
		f:close()
		return read()
	end

	---------- public fields & methods ---------- 
	local self = {
		test = 1
	}

	function self.read()
		return read()
	end

	function self.write(content)
		return write(content)
	end

  -- return the instance
  return self
end

function Users()
  
----------  private fields & methods ---------- 
  	local driver = Driver('/usr/lib/lua/luci/almond/users.json')


	local function jsonToLua(jsonString)
		if(jsonString == "") then
			return nil
		else
			return luci.json.decode(jsonString)
		end
	end

	local function luaToJSON(luaTable)
		return tostring(luci.json.encode(luaTable))
	end

	local function get()
		return driver.read()
	end

	local function set(usersJson)
		return driver.write(usersJson)
	end

  	local function getLua()
		usersJson = get()
		return jsonToLua(usersJson)
	end

	local function setLua(luaTable)
		usersJson = luaToJSON(luaTable)
		return set(usersJson)
	end

---------- public fields & methods ---------- 
	local self = {
		test = 1
	}

	function self.get()
		return get()
	end

	function self.set(userId, userString)
		users = {}
		user = jsonToLua(userString)
		table.insert(users, user)
		return setLua(users) 
	end

	return self
end