##############################
# Definitions
##############################

USER_APPS = {index,variables,conditional}
ALL_JSON = {./,index,puzzle,maze,bird,turtle,movie,pond/docs,pond,pond/tutor,pond/duck, variables}
ALL_TEMPLATES = appengine/template.soy,appengine/index/template.soy,appengine/puzzle/template.soy,appengine/maze/template.soy,appengine/bird/template.soy,appengine/turtle/template.soy,appengine/movie/template.soy,appengine/pond/docs/template.soy,appengine/pond/template.soy,appengine/pond/tutor/template.soy,appengine/pond/duck/template.soy,appengine/variables/template.soy

APP_ENGINE_THIRD_PARTY = appengine/third-party
SOY_COMPILER = java -jar third-party/SoyToJsSrcCompiler.jar --shouldProvideRequireSoyNamespaces --isUsingIjData
SOY_EXTRACTOR = java -jar third-party/SoyMsgExtractor.jar

##############################
# Rules
##############################

all: deps languages


# [davide] target per la compilazione in italiano
index-it:
	mkdir -p appengine/generated/it/
	$(SOY_COMPILER) --outputPathFormat appengine/index/generated/it/soy.js --srcs appengine/index/template.soy
	python build-app.py index it

puzzle-it: common-it
	$(SOY_COMPILER) --outputPathFormat appengine/puzzle/generated/it/soy.js --srcs appengine/puzzle/template.soy
	python build-app.py puzzle it

maze-it: common-it
	$(SOY_COMPILER) --outputPathFormat appengine/maze/generated/it/soy.js --srcs appengine/maze/template.soy
	python build-app.py maze it

variables-it: common-it
	$(SOY_COMPILER) --outputPathFormat appengine/variables/generated/it/soy.js --srcs appengine/variables/template.soy
	python build-app.py variables it

conditional-it: common-it
	$(SOY_COMPILER) --outputPathFormat appengine/conditional/generated/it/soy.js --srcs appengine/conditional/template.soy
	python build-app.py conditional it

bird-it: common-it
	$(SOY_COMPILER) --outputPathFormat appengine/bird/generated/it/soy.js --srcs appengine/bird/template.soy
	python build-app.py bird it

turtle-it: common-it
	$(SOY_COMPILER) --outputPathFormat appengine/turtle/generated/it/soy.js --srcs appengine/turtle/template.soy
	python build-app.py turtle it

movie-it: common-it
	$(SOY_COMPILER) --outputPathFormat appengine/movie/generated/it/soy.js --srcs appengine/movie/template.soy
	python build-app.py movie it

pond-docs-it:
	mkdir -p appengine/pond/generated/it/
	$(SOY_COMPILER) --outputPathFormat appengine/pond/docs/generated/it/soy.js --srcs appengine/pond/docs/template.soy
	python build-app.py pond/docs it

pond-tutor-it: pond-common-it
	$(SOY_COMPILER) --outputPathFormat appengine/pond/tutor/generated/it/soy.js --srcs appengine/pond/tutor/template.soy
	python build-app.py pond/tutor it

pond-duck-it: pond-common-it
	$(SOY_COMPILER) --outputPathFormat appengine/pond/duck/generated/it/soy.js --srcs appengine/pond/duck/template.soy
	python build-app.py pond/duck it

genetics-it: common-it
	$(SOY_COMPILER) --outputPathFormat appengine/genetics/generated/it/soy.js --srcs appengine/genetics/template.soy
	python build-app.py genetics it

pond-common-it: common-it
	$(SOY_COMPILER) --outputPathFormat appengine/pond/generated/it/soy.js --srcs appengine/pond/template.soy

common-it:
	$(SOY_COMPILER) --outputPathFormat appengine/generated/it/soy.js --srcs appengine/template.soy

links:
	rm appengine/variables/js/chip.js; \
	rm appengine/variables/js/chip-blocks.js; \
	rm appengine/conditional/js/chip.js; \
	rm appengine/conditional/js/chip-blocks.js; \
	ln appengine/chip/js/chip.js appengine/variables/js; \
	ln appengine/chip/js/chip-blocks.js appengine/variables/js; \
	ln appengine/chip/js/chip.js appengine/conditional/js; \
	ln appengine/chip/js/chip-blocks.js appengine/conditional/js

#it: link index-it puzzle-it maze-it bird-it turtle-it movie-it pond-docs-it pond-tutor-it pond-duck-it genetics-it

it: index-it chip-it puzzle-it maze-it variables-it conditional-it

# [davide] fine modifiche
languages:
	$(SOY_EXTRACTOR) --outputFile extracted_msgs.xlf --srcs $(ALL_TEMPLATES)
	i18n/xliff_to_json.py --xlf extracted_msgs.xlf --templates $(ALL_TEMPLATES)
	@for app in $(ALL_JSON); do \
	  mkdir -p appengine/$$app/generated; \
	  i18n/json_to_js.py --path_to_jar third-party --output_dir appengine/$$app/generated --template appengine/$$app/template.soy --key_file json/keys.json json/*.json; \
	done
	@for app in $(USER_APPS); do \
	  echo; \
	  echo --- $$app; \
	  for lang in `ls appengine/$$app/generated`; do \
	    python build-app.py $$app $$lang; \
	  done \
	done

deps:
	mkdir -p third-party
	@# All following commands are in third-party, use backslashes to keep them on the same line as the cd command.
	cd third-party; \
	svn checkout https://github.com/google/closure-library/trunk/closure/bin/build build; \
	wget -N https://dl.google.com/closure-templates/closure-templates-for-javascript-latest.zip; \
	unzip -o closure-templates-for-javascript-latest.zip SoyToJsSrcCompiler.jar; \
	unzip -o closure-templates-for-javascript-latest.zip -d ../$(APP_ENGINE_THIRD_PARTY) soyutils_usegoog.js; \
	wget -N https://dl.google.com/closure-templates/closure-templates-msg-extractor-latest.zip; \
	unzip -o closure-templates-msg-extractor-latest.zip SoyMsgExtractor.jar; \
	wget -N https://dl.google.com/closure-compiler/compiler-latest.zip; \
	unzip -o compiler-latest.zip -x COPYING README.md; \
	mv -f closure-compiler-v*.jar closure-compiler.jar; \
	chmod +x build/closurebuilder.py

	mkdir -p $(APP_ENGINE_THIRD_PARTY)
	svn checkout https://github.com/google/closure-library/trunk/closure/goog/ $(APP_ENGINE_THIRD_PARTY)/goog
	svn checkout https://github.com/google/closure-library/trunk/third_party/closure/goog/ $(APP_ENGINE_THIRD_PARTY)/third_party_goog
	svn checkout https://github.com/ajaxorg/ace-builds/trunk/src-min-noconflict/ $(APP_ENGINE_THIRD_PARTY)/ace
	svn checkout https://github.com/google/blockly/trunk/ $(APP_ENGINE_THIRD_PARTY)/blockly
	svn checkout https://github.com/CreateJS/SoundJS/trunk/lib/ $(APP_ENGINE_THIRD_PARTY)/SoundJS
	svn checkout https://github.com/gleitz/midi-js-soundfonts/trunk/FluidR3_GM/acoustic_guitar_nylon-mp3/ $(APP_ENGINE_THIRD_PARTY)/midi-js-soundfonts/guitar
	svn checkout https://github.com/gleitz/midi-js-soundfonts/trunk/FluidR3_GM/acoustic_grand_piano-mp3/ $(APP_ENGINE_THIRD_PARTY)/midi-js-soundfonts/piano
	svn checkout https://github.com/gleitz/midi-js-soundfonts/trunk/FluidR3_GM/banjo-mp3/ $(APP_ENGINE_THIRD_PARTY)/midi-js-soundfonts/banjo
	svn checkout https://github.com/gleitz/midi-js-soundfonts/trunk/FluidR3_GM/choir_aahs-mp3/ $(APP_ENGINE_THIRD_PARTY)/midi-js-soundfonts/choir
	svn checkout https://github.com/gleitz/midi-js-soundfonts/trunk/FluidR3_GM/flute-mp3/ $(APP_ENGINE_THIRD_PARTY)/midi-js-soundfonts/flute
	svn checkout https://github.com/gleitz/midi-js-soundfonts/trunk/FluidR3_GM/melodic_tom-mp3/ $(APP_ENGINE_THIRD_PARTY)/midi-js-soundfonts/drum
	svn checkout https://github.com/gleitz/midi-js-soundfonts/trunk/FluidR3_GM/trumpet-mp3/ $(APP_ENGINE_THIRD_PARTY)/midi-js-soundfonts/trumpet
	svn checkout https://github.com/gleitz/midi-js-soundfonts/trunk/FluidR3_GM/violin-mp3/ $(APP_ENGINE_THIRD_PARTY)/midi-js-soundfonts/violin

	@# messages.js confuses the compiler by also providing "Blockly.Msg.en".
	rm $(APP_ENGINE_THIRD_PARTY)/blockly/msg/messages.js
	svn checkout https://github.com/NeilFraser/JS-Interpreter/trunk/ $(APP_ENGINE_THIRD_PARTY)/JS-Interpreter
	java -jar third-party/closure-compiler.jar\
	 --js appengine/third-party/JS-Interpreter/acorn.js\
	 --js appengine/third-party/JS-Interpreter/interpreter.js\
	 --js_output_file appengine/third-party/JS-Interpreter/compiled.js

clean: clean-languages clean-deps

clean-languages:
	rm -rf appengine/$(ALL_JSON)/generated
	rm -f json/keys.json

clean-deps:
	rm -rf appengine/third-party
	rm -rf third-party

# Prevent non-traditional rules from exiting with no changes.
.PHONY: deps
