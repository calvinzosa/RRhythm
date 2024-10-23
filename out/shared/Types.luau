-- Compiled with roblox-ts v3.0.0
--[[
	
	local s = ''
	local function check(i,l)
	    if #s == 0 then
	        s = string.format('\nexport type %s = %s & {\n',i.Name,i.ClassName)
	    end
	    local indent = string.rep('	',l)
	    for _, child in i:GetChildren() do
	        local childType = string.format('%s%s: %s', indent, child.Name, child.ClassName)
	        if #child:GetChildren() > 0 then
	            s..=`{childType} & \{\n`
	            check(child,l+1)
	            s..=`{indent}};\n`
	        else
	            s..=`{childType};\n`
	        end
	    end
	end
	check(game, 1)s..='};\n'print(s)
	
]]
-- Standard Types
-- Replicated Storage
-- Models
-- User Interface
-- Gameplay
return nil
