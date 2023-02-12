INSTALL=npm install --save
PKG=npx pkg
NODE_VERSION=14
FILE=src/lythonc.js
all:  configure
	$(PKG) --targets node$(NODE_VERSION) $(FILE)
configure:
	$(INSTALL) pkg