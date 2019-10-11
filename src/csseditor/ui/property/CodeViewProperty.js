import BaseProperty from "./BaseProperty";
import { LOAD, DEBOUNCE } from "../../../util/Event";
import { editor } from "../../../editor/editor";
import { EVENT } from "../../../util/UIElement";
import { CSS_TO_STRING, TAG_TO_STRING } from "../../../util/functions/func";

export default class CodeViewProperty extends BaseProperty {
  getTitle() {
    return "CodeView";
  }

  [EVENT(
    'refreshSelectionStyleView', 
    'refreshStyleView',
    'refreshSelection',
    'refreshSVGArea'
  ) + DEBOUNCE(100) ]() {
    this.refreshShowIsNot();
  }

  getBody() {
    return `
      <div class="property-item code-view-item" ref='$body'></div>
    `;
  }

  filterKeyName (str) {
    return str.split(';').filter(it => it.trim()).map(it => {
      it = it.trim();
      var [key, value] = it.split(':')

      return `<strong>${key}</strong>:${value};\n` 
    }).join('').trim()
  }

  modifyNewLine (str) {
    return str.replace(/;/gi, ";\n").trim()
  }

  [LOAD('$body')] () {

    var currentProject = editor.selection.currentProject;
    var keyframeCode = currentProject ? currentProject.toKeyframeString() : ''
    var rootVariable = currentProject ? CSS_TO_STRING(currentProject.toRootVariableCSS()) : ''
    var svgCode = currentProject ? currentProject.toSVGString() : '';

    rootVariable = this.filterKeyName(rootVariable.trim());
    keyframeCode = this.modifyNewLine(keyframeCode.trim());
    svgCode = svgCode.replace(/\</g, '&lt;').replace(/\>/g, '&gt;') 

    var current = editor.selection.current;
    var cssCode = current ? TAG_TO_STRING(current.toExport()) : ''
    var svgPropertyCode = current ? TAG_TO_STRING(current.toExportSVGCode()) : '' 
    var selectorCode = current ? current.selectors : [];

    cssCode = this.filterKeyName(cssCode.trim())
    // svgPropertyCode = this.filterKeyName(svgPropertyCode.trim())


    return /*html*/`
      <div class=''>
       
        ${cssCode ? 
          /*html*/`<div>
          <pre title='CSS'>${cssCode}</pre>
          </div>` : ''
        }

        ${svgPropertyCode ? 
          /*html*/`<div>
          <pre title='SVG'>${svgPropertyCode}</pre>
          </div>` : ''
        }        

        ${selectorCode.length ? 
          /*html*/`<div>
            ${selectorCode.map(selector => {
              return `<pre title='${selector.selector}'>${selector.toPropertyString()}</pre>`
            }).join('')}
            
          </div>` : ''
        }

        ${keyframeCode ?         
          /*html*/`<div>
          <pre title='Keyframe'>${keyframeCode}</pre>
        </div>` : ''}
        ${rootVariable ? 
          /*html*/`<div>
          <label>:root</label>
          <pre>${rootVariable}</pre>
          </div>` : ''
        }
        ${svgCode ? 
          /*html*/`<div>
          <pre title='SVG'>${svgCode}</pre>
          </div>` : ''
        }

      </div>
    `

  }
}
