CC=$(COCONUT_OPENWRT_DIR)/staging_dir/toolchain-arm_gcc-4.5.1+l_uClibc-0.9.32_eabi/bin/arm-openwrt-linux-gcc
CPPC=$(COCONUT_OPENWRT_DIR)/staging_dir/toolchain-arm_gcc-4.5.1+l_uClibc-0.9.32_eabi/bin/arm-openwrt-linux-g++

LIBS=-lTouch -lAlmondGui -lAlmond -lAlmondHA -lAlmondXML -lLogger -lAlmondPNG -lpthread -lpng -lz -luci

INCLUDES=-I$(COCONUT_OPENWRT_DIR)/staging_dir/target-arm_uClibc-0.9.32_eabi/usr/include
LIB_DIR=$(COCONUT_OPENWRT_DIR)/staging_dir/target-arm_uClibc-0.9.32_eabi/usr/lib

SOURCES=setdevice.cpp lua_libAlmondHA.cpp
EXECUTABLE=setdevice

ss:
	$(CPPC) setdevice.cpp lua_libAlmondHA.cpp $(INCLUDES) -L$(LIB_DIR) $(LIBS) -o $(EXECUTABLE)
#	$(CPPC) setdevice.cpp lua_libAlmondHA.cpp $(INCLUDES) -L$(LIB_DIR) $(LIBS) -o $(EXECUTABLE)
	cp setdevice $(COCONUT_OUTPUT_DIR)/../www
	cp almond.lua $(COCONUT_OUTPUT_DIR)/../usr/lib/lua/luci/controller


clean:
	rm -rf setdevice *.o



