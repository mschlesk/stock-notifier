install:
		npm install --production

package:
		zip -r function.zip node_modules package.json package-lock.json index.js

clean:
		rm -rf ./node_modules