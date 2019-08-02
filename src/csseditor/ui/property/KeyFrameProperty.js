import BaseProperty from "./BaseProperty";
import icon from "../icon/icon";
import {
  LOAD,
  CLICK,
  DRAGSTART,
  DRAGOVER,
  DROP,
  PREVENT,
  DEBOUNCE
} from "../../../util/Event";

import { editor } from "../../../editor/editor";
import { EVENT } from "../../../util/UIElement";

import { Keyframe } from "../../../editor/css-property/Keyframe";

export default class KeyFrameProperty extends BaseProperty {
  getTitle() {
    return "Keyframes";
  }
  getBody() {
    return `<div class='property-item keyframe-list' ref='$keyframeList'></div>`;
  }

  getTools() {
    return `
      <button type="button" ref="$add" title="add Filter">${icon.add}</button>
    `;
  }

  makeKeyframeTemplate (keyframe, index) {
    index = index.toString()
    return `
      <div class='keyframe-item' draggable='true' ref='$keyframeIndex${index}' data-index='${index}'>
        <div class='title'>
          <div class='name'>${keyframe.name}</div>
          <div class='tools'>
              <button type="button" class="del" data-index="${index}">${icon.remove2}</button>
          </div>
        </div>
        <div class='offset-list'>
          <div class='container'>
            ${keyframe.offsets.map(o => {
              return `
              <div class='offset' style='left: ${o.offset}; background-color: ${o.color}'></div>
              `
            }).join('')}
          </div>
        </div>
        <div class='keyframe-code'>
            <pre>${keyframe.toCSSText()}</pre>
        </div>
      </div>
    `
  }

  [CLICK('$keyframeList .keyframe-item')] (e) {
    var index  = +e.$delegateTarget.attr('data-index');

    var current = editor.selection.currentProject;
    if (!current) return;


    this.viewKeyframePicker(index);

  }

  [CLICK('$keyframeList .del') + PREVENT] (e) {
    var removeIndex = e.$delegateTarget.attr("data-index");
    var current = editor.selection.currentProject;
    if (!current) return;

    current.removeKeyframe(removeIndex);

    this.emit('refreshStyleView', current);

    this.refresh();
  }

  [EVENT('refreshSelection') + DEBOUNCE(100)] () {
    this.refreshShowIsNot('project');
  }


  [LOAD("$keyframeList")]() {
    var current = editor.selection.currentProject;

    if (!current) return '';

    var keyframes = current.keyframe ? Keyframe.parseStyle(current) : current.keyframes;

    current.keyframe = ''
    current.keyframes = keyframes;

    return keyframes.map((keyframe, index) => {
      return this.makeKeyframeTemplate(keyframe, index);
    });
  }

  // keyframe-item 을 통째로  dragstart 를 걸어버리니깐
  // 다른 ui 를 핸들링 할 수가 없어서
  // title  에만 dragstart 거는 걸로 ok ?
  [DRAGSTART("$keyframeList .keyframe-item .title")](e) {
    this.startIndex = +e.$delegateTarget.attr("data-index");
  }

  // drop 이벤트를 걸 때 dragover 가 같이 선언되어 있어야 한다.
  [DRAGOVER("$keyframeList .keyframe-item") + PREVENT](e) {}

  [DROP("$keyframeList .keyframe-item") + PREVENT](e) {
    var targetIndex = +e.$delegateTarget.attr("data-index");
    var current = editor.selection.currentProject;
    if (!current) return;

    current.sortKeyframe(this.startIndex, targetIndex);

    this.emit('refreshStyleView', current);

    this.refresh();
  }

  [CLICK("$add")]() {

    var current = editor.selection.currentProject;
    if (current) {
      current.createKeyframe();

      this.emit('refreshStyleView', current);
    }

    this.refresh();
  }

  viewKeyframePicker(index) {
    if (typeof this.selectedIndex === "number") {
      this.selectItem(this.selectedIndex, false);
    }

    this.selectedIndex = +index;
    this.selectItem(this.selectedIndex, true);
    this.current = editor.selection.currentProject;

    if (!this.current) return;
    this.currentKeyframe = this.current.keyframes[
      this.selectedIndex
    ];

    this.viewKeyframePropertyPopup();
  }


  // 객체를 선택하는 괜찮은 패턴이 어딘가에 있을 텐데......
  // 언제까지 selected 를 설정해야하는가?
  selectItem(selectedIndex, isSelected = true) {
    if (isSelected) {
      this.getRef('$keyframeIndex', selectedIndex).addClass("selected");
    } else {
      this.getRef('$keyframeIndex', selectedIndex).removeClass("selected");
    }

    if (this.current) {
      this.current.keyframes.forEach((it, index) => {
        it.selected = index === selectedIndex;
      });
    }
  }  

  viewKeyframePropertyPopup(position) {
    this.current = editor.selection.currentProject;

    if (!this.current) return;
    this.currentKeyframe = this.current.keyframes[
      this.selectedIndex
    ];

    const back = this.currentKeyframe;

    const name = back.name
    const offsets = back.offsets

    this.emit("showKeyframePopup", {
      position,
      name, 
      offsets
    });
  }

  [EVENT('changeKeyframePopup')] (data) {
    var project = editor.selection.currentProject;

    if (!project) return;
    this.currentKeyframe = project.keyframes[
      this.selectedIndex
    ];

    if (this.currentKeyframe) {
      this.currentKeyframe.reset(data);
    }

    this.refresh();
    this.emit('refreshStyleView', project);
  }

}