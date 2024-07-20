import { html, css, _$LE, PropertyValueMap } from "lit"
import {guard} from 'lit/directives/guard.js'
import { LitElementWw } from "@webwriter/lit"
import { LitElement } from "lit"
import { customElement, property, query } from "lit/decorators.js"

import SlButton from '@shoelace-style/shoelace/dist/components/button/button.component.js'
import SlInput from '@shoelace-style/shoelace/dist/components/input/input.component.js'
import SlCard from '@shoelace-style/shoelace/dist/components/card/card.component.js'
import SlIconButton from '@shoelace-style/shoelace/dist/components/icon-button/icon-button.component.js'
import SlDrawer from '@shoelace-style/shoelace/dist/components/drawer/drawer.component.js'
import SlRange from '@shoelace-style/shoelace/dist/components/range/range.component.js'
import SlDropdown from '@shoelace-style/shoelace/dist/components/dropdown/dropdown.component.js'
import SlMenu from '@shoelace-style/shoelace/dist/components/menu/menu.component.js'
import SlMenuItem from '@shoelace-style/shoelace/dist/components/menu-item/menu-item.component.js'
import SlCheckbox from '@shoelace-style/shoelace/dist/components/checkbox/checkbox.component.js'
import SlIcon from '@shoelace-style/shoelace/dist/components/icon/icon.component.js'
import SlColorPicker from "@shoelace-style/shoelace/dist/components/color-picker/color-picker.component.js"
import SlDetails from '@shoelace-style/shoelace/dist/components/details/details.component.js'
import { SlTextarea } from "@shoelace-style/shoelace"

import { videoData } from '../models/videoData'
import {WwInteractiveBauble} from './webwriter-interactive-bauble'
import { WwVideoInteraction } from './webwriter-video-interaction'
import { style } from '../widgetStyle.css'

import play from "../assets/play.svg"
import pause from "../assets/pause.svg"
import volumeDown from "../assets/volumeDown.svg"
import volumeOff from "../assets/volumeOff.svg"
import volumeMute from "../assets/volumeMute.svg"
import volumeUp from "../assets/volumeUp.svg"

import add from "../assets/add.svg"
import fullscreenEnter from "../assets/fullscreenEnter.svg"
import fullscreenExit from "../assets/fullscreenExit.svg"
import gear from "../assets/gear.svg"
import trash from "../assets/trash.svg"
import resize from "../assets/resize.svg"
import chapter from "../assets/chapter.svg"



@customElement("webwriter-interactive-video")
export class WebwriterInteractiveVideo extends LitElementWw {
  static get scopedElements() {
    return {
      'sl-textarea': SlTextarea,
      'sl-button': SlButton,
      'sl-input': SlInput,
      'sl-card': SlCard,
      'sl-icon-button': SlIconButton,
      'sl-drawer': SlDrawer,
      'sl-range': SlRange,
      'sl-dropdown': SlDropdown,
      'sl-menu': SlMenu,
      'sl-menu-item': SlMenuItem,
      'webwriter-interactive-bauble': WwInteractiveBauble,
      'sl-checkbox': SlCheckbox,
      'sl-icon': SlIcon,
      'sl-color-picker': SlColorPicker,
      'sl-details': SlDetails
    }
  }

  static styles = style;
  

  @property({ type: Boolean, attribute: true, reflect: true })
  videoLoaded: boolean = false;

  @property({type: Boolean})
  interactionActive= false;

  @property({ type: String })
  videoDurationFormatted: string = '00:00';

  @property({ type: String, attribute: true, reflect: true,})
  videoBase64: string = '';

  @query('#fileInput')
  fileInput: HTMLInputElement;

  @query('#color-picker')
  colorPicker: SlColorPicker;

  @query('#chapters-drawer')
  chaptersDrawer: SlDrawer;

  @property({ attribute: false })
  files: FileList;

  @query('#progress-bar')
  progressBar;

  @query('#controls-upper')
  upperControls: HTMLDivElement;

  @query('#video')
  videoElement: HTMLVideoElement;

  @query('#interactions-drawer')
  drawer: SlDrawer;

  @query('#time-stamp')
  timeStamp;

  @query('#volume-slider')
  volumeSlider;

  @query('#interaction-container')
  interactionContainer : HTMLDivElement;

  @query('#interaction-slot')
  interactionSlot : HTMLSlotElement;

  @query('#replace-timestamp')
  replaceTimestamp : SlInput;

  @property()
  activeElement : number;

  @query('#drop-area')
  dropArea;

  @property()
  videoData : Map<number, videoData> = new Map()

  @property()
  lastTimeupdate : number = 0;

  @property({type: Boolean, attribute: true, reflect: true})
  showInteractions = false;

  @property({type: Boolean, attribute: true, reflect: true})
  showOverlay = true;


  @property({ type: String, attribute: true, reflect: true })
  interactionConfig: string = '[]';

  @property({type: Number})
  overlayZIndex = 50;

  @property({type: Boolean})
  isDragging = false;

  @property({ type: Boolean, attribute: true, reflect: true })
  hasChapters = false;

  @property({ type: String, attribute: true, reflect: true })
  chapterConfig: string = '[]';

  @query('#overlay-start-time-input')
  overlayStartTimeInput: SlInput;
  
  @query('#overlay-end-time-input')
  overlayEndTimeInput: SlInput;

  @query('#overlay-x-position-input')
  OverlayXPositionInput: SlInput;

  @query('#overlay-y-position-input')
  OverlayYPositionInput: SlInput;

  @query('#overlay-content-input')
  overlayContentInput: SlInput;

  @query('#overlay-width-input')
  overlayWidthInput: SlInput;

  @query('#overlay-height-input')
  overlayHeightInput: SlInput;

  @query('#replace-interaction-settings')
  replaceInteractionSettings: HTMLElement;

  @query('#overlay-interaction-settings')
  overlayInteractionSettings: HTMLElement;



  // Button queries

  @query('#play')
  playButton: SlButton;

  @query('#mute-volume-button')
  muteButton: SlButton;

  @query('#fullscreen-button')
  fullscreenButton: SlButton;

  @query('#add-button')
  addButton: SlButton;

  @query('#settings-button')
  settingsButton: SlButton;

  @property({type: HTMLVideoElement})
  video;



  
  handleAddClick = () => {
    if (!this.videoLoaded) return;
    if (!this.drawer.open) {
      this.drawer.open = true;
      this.overlayZIndex = 0;
    }
    this.hideDrawerContent();
  }

  static shadowRootOptions = {...LitElement.shadowRootOptions, delegatesFocus: true };


  /*
  * Handles the selection of the interaction type in the dropdown menu, and adds an interactive element into the container
  *
  * @param e - CustomEvent containing the selected item from the dropdown
  * 
  */
  handleInteractionTypeSelected = (e: CustomEvent) => {
    if(!this.videoLoaded) return;
    if (e.detail.item.value == 1) { // replace
      this.showReplaceSettings();
      const interaction = document.createElement('webwriter-video-interaction') as WwVideoInteraction;
      interaction.setAttribute("id", `${WwInteractiveBauble.nextId++}`);
      this.videoData.set(interaction.id, {
        isReplace: true, 
        startTime: this.video.currentTime});
      interaction.slot = 'interaction-slot';
      this.appendChild(interaction);
      this.changeActiveElement(interaction.id);
      this.replaceTimestamp.value = this.formatTime(this.video.currentTime);
    } else { // overlay
      this.showOverlaySettings();
      const interaction = document.createElement('webwriter-video-interaction') as WwVideoInteraction;
      interaction.setAttribute("id", `${WwInteractiveBauble.nextId++}`);
      this.videoData.set(interaction.id, {
        isReplace: false,
        startTime: this.video.currentTime,
        endTime: this.video.currentTime + 5, // Default 5 seconds duration
        position: { x: 0, y: 0 },
        content: 'Hello, World',
        size: { width: 100, height: 100 }
      });
      interaction.slot = 'interaction-slot';
      this.appendChild(interaction);
      this.changeActiveElement(interaction.id);
      this.setOverlaySettingsContentFromVideoSetting();
    }
    this.saveInteractionConfig();
  }

  setOverlaySettingsContentFromVideoSetting() {
    const data = this.videoData.get(this.activeElement);
    this.overlayStartTimeInput.value = this.formatTime(data.startTime);
    this.overlayEndTimeInput.value = this.formatTime(data.endTime);
    this.OverlayXPositionInput.value = `${data.position.x}`;
    this.OverlayYPositionInput.value = `${data.position.y}`;
    this.overlayContentInput.value = `${data.content}`;
    this.overlayWidthInput.value = `${data.size.width}`;
    this.overlayHeightInput.value = `${data.size.height}`;
  }

  hideDrawerContent() {
    this.replaceInteractionSettings.hidden = true;
    this.overlayInteractionSettings.hidden = true;
  }

  showReplaceSettings() {
    this.replaceInteractionSettings.hidden = false;
    this.overlayInteractionSettings.hidden = true;
  }

  showOverlaySettings() {
    this.replaceInteractionSettings.hidden = true;
    this.overlayInteractionSettings.hidden = false;
  }

  /*
  * Sets up some default values for the overlay
  */
  firstUpdated() {
    if(this.videoBase64) {
      this.setupVideo(this.videoBase64);
    }
    this.updateBaublePositions();
    this.requestUpdate();
  }

  
  handleBaubleClick(event: MouseEvent) {
    const clickedElement = event.target as WwInteractiveBauble;
    if(event.ctrlKey) {
      this.video.currentTime = this.videoData.get(clickedElement.id).startTime;
      return;
    } else {
      this.clickEventHelper(clickedElement.id);
    }
  }

  clickEventHelper(id: number){
    this.changeActiveElement(id);
    const interactionData = this.videoData.get(id);
    
    if (interactionData.isReplace) {
      this.replaceTimestamp.value = this.formatTime(interactionData.startTime);
      this.showReplaceSettings();
    } else {
      this.showOverlaySettings();
      // Update overlay settings inputs
      this.overlayStartTimeInput.value = this.formatTime(interactionData.startTime);
      this.overlayEndTimeInput.value  = this.formatTime(interactionData.endTime);
      this.OverlayXPositionInput.value = `${interactionData.position.x}`;
      this.OverlayYPositionInput.value = `${interactionData.position.y}`;
      this.overlayContentInput.value = `${interactionData.content}`;
      this.overlayWidthInput.value = `${interactionData.size.width}`;
      this.overlayHeightInput.value = `${interactionData.size.height}`;
      this.colorPicker.setAttribute('value', interactionData.color);
    }
    
    if (!this.drawer.open) {
      this.drawer.open = true;
      this.overlayZIndex = 0;
    }
  }

  saveInteractionConfig() {
    const config = Array.from(this.videoData.entries()).map(([id, data]) => ({id, ...data}));
    this.interactionConfig = JSON.stringify(config);
  }
  
  loadInteractionConfig() {
    if (this.interactionConfig) {
      const config = JSON.parse(this.interactionConfig);
      this.videoData.clear();
      config.forEach(item => {
        const { id, ...data } = item;
        this.videoData.set(id, data);
      });
      this.requestUpdate();
    }
  }

  changeActiveElement(newActive: number) {
    this.activeElement = newActive;
    this.interactionSlot.assignedElements().forEach((element: WwVideoInteraction) => {
      if(element.id == newActive) {
        element.active = true;
      } else {
        element.active = false;
      } 
    });
  }


  handleTimeInputChange = (e: CustomEvent, index?: number) => {
    const input = e.target as SlInput;
    const newTime = this.parseTime(input.value);
    
    if (newTime !== null) {
      if (index !== undefined) {
        console.log('updating chapter', index, 'to', newTime)
        this.updateChapterTime(index, newTime);
      } else {
        this.baubleTimeUpdateHelper(newTime, this.activeElement, input);
      }
      input.value = this.formatTime(newTime);
    } else {
      input.helpText = "Invalid time format. Use hh:mm:ss or mm:ss";
    }
    this.updateBaublePositions();
    this.requestUpdate();
  }

  baubleTimeUpdateHelper(newTime: number, index: number,input: SlInput) {
          const data = this.videoData.get(index);
          if (data) {
            if (input === this.overlayStartTimeInput) {
              data.startTime = newTime;
              if(newTime > data.endTime){
                data.endTime = newTime + 5;
                this.overlayEndTimeInput.value = this.formatTime(data.endTime);
              }
            } else if (input === this.overlayEndTimeInput) {
              data.endTime = newTime;
            } else if (input === this.replaceTimestamp) {
              data.startTime = newTime;
            }
            this.videoData.set(index, data);
            this.saveInteractionConfig();
          }
  }

  calculateOffset(time: number) {
    if(!this.videoLoaded || !this.video) return;
    const rect = this.video.getBoundingClientRect();
    return (time / this.video.duration) * 0.95 * rect.width;
  }

  handleShowInteractionsChange = (e: CustomEvent) => {
    const target = e.target as SlCheckbox;
    this.showInteractions = target.checked;
  }

  handleBaubleDragStart = (e:DragEvent) => {
    e.dataTransfer.setData('id', (e.target as WwInteractiveBauble).id);
    e.dataTransfer.setData('previousActive', `${this.activeElement}`);
    this.changeActiveElement((e.target as WwInteractiveBauble).id);
    this.changeAddToTrash();
  }

  changeAddToTrash() {
    this.addButton.setAttribute('src',`${trash}`)
    this.addButton.style.color = 'hsl(0 72.2% 50.6%)';
  }

  changeTrashToAdd() {
    this.addButton.setAttribute('src',`${add}`)
    this.addButton.style.color = 'hsl(200.4 98% 39.4%)';
  }
  



  
  handleShowOverlayChange = (e: CustomEvent) => {
    const target = e.target as SlCheckbox;
    this.showOverlay = target.checked;
  }

  render() {
    return html`
      <!-- teacher options bugged, maybe its a focus issue idk im putting it here so i can access them -->
      ${this.renderTeacherOptions()}
      ${this.videoLoaded ? this.widget() 
        : this.renderFileInputArea()}
    `;
  }

  

  renderTeacherOptions() {
    return html`
    <div style='display:flex;'>
      <sl-checkbox @sl-change=${this.handleShowInteractionsChange} style='overflow: hidden'>Show Interactions</sl-checkbox>
      <sl-checkbox checked @sl-change=${this.handleShowOverlayChange} style='overflow: hidden'>Show Overlays</sl-checkbox>
      <sl-checkbox @sl-change=${this.handleHasChaptersChange} style='overflow: hidden'>Has Chapters</sl-checkbox>
    </div>
    `
  }

  handleHasChaptersChange = (e: CustomEvent) => {
    const target = e.target as SlCheckbox;
    this.hasChapters = target.checked;
    this.requestUpdate();
  }

  renderChaptersDrawer() {
    return html`
      <sl-drawer contained label="Chapters" id="chapters-drawer">
        ${this.renderChaptersList()}
        <sl-button @click=${this.addChapter}>Add Chapter</sl-button>
      </sl-drawer>
    `;
  }

  toggleChaptersDrawer() {
    this.chaptersDrawer.open = !this.chaptersDrawer.open;
  }

  getCurrentChapter(): { title: string, startTime: number } | null {
    if (!this.hasChapters) return null;
    
    const chapters = JSON.parse(this.chapterConfig);
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (this.video.currentTime >= chapters[i].startTime) {
        return chapters[i];
      }
    }
    return null;
  }
  
  renderChaptersList() {
    const chapters = JSON.parse(this.chapterConfig);
    return html`
      <ul class="chapter-list">
        ${chapters.map((chapter, index) => html`
          <li class="chapter-item">
            ${this.isContentEditable 
              ? html`
                <sl-input label="Title" 
                          value=${chapter.title} 
                          @sl-change=${(e) => this.updateChapterTitle(index, e.target.value)}>
                </sl-input>
                ${index === 0 
                  ? html`<p>Start Time: 00:00</p>`
                  : html`
                    <sl-input 
                      label="Start Time" 
                      value=${this.formatTime(chapter.startTime)} 
                      @sl-change=${(e) => this.handleTimeInputChange(e, index)}
                    ></sl-input>
                  `
                }
                ${index > 0 ? html`<sl-button variant="danger" @click=${() => this.deleteChapter(index)}>Delete</sl-button>` : ''}
              `
              : html`
                <div class="chapter-info">
                  <strong>${chapter.title}</strong> - Start Time: ${this.formatTime(chapter.startTime)}
                </div>
              `
            }
            <sl-button variant="primary" @click=${() => this.jumpToChapter(index)}>Jump to Chapter</sl-button>
          </li>
        `)}
      </ul>
    `;
  }

  jumpToChapter(index: number) {
    const chapters = JSON.parse(this.chapterConfig);
    if (chapters[index]) {
      this.video.currentTime = chapters[index].startTime;
    }
  }

  addChapter() {
    const chapters = JSON.parse(this.chapterConfig);
    const lastChapter = chapters[chapters.length - 1];
    const newStartTime = lastChapter ? Math.min(lastChapter.startTime + 60, this.video.duration) : 0;
    chapters.push({
      title: `Chapter ${chapters.length + 1}`,
      startTime: newStartTime
    });
    this.updateChapters(chapters);
  }

  updateChapterTime(index: number, newTime: number) {
    if (index === 0) return;
    let chapters = JSON.parse(this.chapterConfig);
    /*
    if (index > 0 && newTime <= chapters[index - 1].startTime) {
      return;
    }
    if (index < chapters.length - 1 && newTime >= chapters[index + 1].startTime) {
      return;
    }
    */
    chapters[index].startTime = newTime;
    this.updateChapters(chapters);
  }

  updateChapterTitle(index: number, newTitle: string) {
    const chapters = JSON.parse(this.chapterConfig);
    chapters[index].title = newTitle;
    this.updateChapters(chapters);
  }

  parseTime(timeStr: string): number | null {
    const parts = timeStr.toString().split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return null;
  }

  updateChapters(chapters: any[]) {
    chapters.sort((a, b) => a.startTime - b.startTime);
    this.chapterConfig = JSON.stringify(chapters);
    this.requestUpdate();
  }

  deleteChapter(index: number) {
    const chapters = JSON.parse(this.chapterConfig);
    chapters.splice(index, 1);
    this.updateChapters(chapters);
  }



  handleDragOverFileInputArea(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  handleDropOnFileInputArea(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  handleFileInput(e: Event) {
    const fileInput = e.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result as string;
      if (result) {
        this.videoBase64 = result;
        this.setupVideo(result);
      }
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
    };
    reader.readAsDataURL(file);
  }

  handleUrlInput(e: CustomEvent) {
    const input = e.target as SlInput;
    const url = input.value;
    if (url) {
      this.setupVideo(url);
    }
  }

  widget() {
    return html`
      <div id='container-vertical'>
        <!-- container for the video element -->
        <div class='container-video' @click=${this.handleVideoClick}>
          ${this.video}
          ${this.videoLoaded ? this.renderOverlays() : undefined}
        </div>
        <!-- container for the controls -->
        <div id='controls'>
          ${this.renderInteractiveBaubles()}
          ${this.renderProgressBar()}
          ${this.renderLowerControls()}
        </div>
        ${this.renderChaptersDrawer()}
        ${this.renderInteractionDrawer()}
      </div>`;
  }

  renderInteractionDrawer() {
    return html`
    <sl-drawer style="z-index: 100;"label='Add Interaction' contained id='interactions-drawer'>
      ${this.renderInteractionTypeSelector()}
      <div id='interaction-settings-container'>
        ${this.renderReplaceInteractionSettings()}
        ${this.renderOverlayInteractionSettings()}
      </div>
    </sl-drawer>`
  }

  renderProgressBar() {
    return html`
    <div id='progress-bar-container'>
      <sl-range id='progress-bar' @sl-change=${this.handleProgressChange}></sl-range>
    </div>`
  }

  renderCurrentChapter() {
    const currentChapter = this.getCurrentChapter();
    return currentChapter ? html`<div id="current-chapter">${currentChapter.title}</div>` : '';
  }

  renderLowerControls() {
    return html`
    <div id='controls-lower'>
      <div id='controls-lower-left'>
        <sl-icon-button class='icon-button' id='play' @click=${this.handlePlayClick} src='${play}'></sl-icon-button>
        <p id='time-stamp'>00:00/00:00</p>
        ${this.hasChapters ? html`<sl-icon-button class='icon-button' id='chapters-button' @click=${this.toggleChaptersDrawer} src='${chapter}'></sl-icon-button>` : ''}
        ${this.renderCurrentChapter()}
      </div>
      <!-- contains the volume slider and other controls -->
      <div id='controls-lower-right'>
        <sl-icon-button class='icon-button' 
                        id='mute-volume-button' 
                        @click=${this.handleMuteClick} 
                        src='${volumeDown}'>
        </sl-icon-button>
        <sl-range id='volume-slider' @sl-change=${this.handleVolumeChange}></sl-range>
        <sl-icon-button class='icon-button' 
                        src='${add}' 
                        id='add-button' 
                        @click=${this.handleAddClick} 
                        @drop=${this.handleBaubleDroppedOnAdd} 
                        enabled=${this.isContentEditable}>
        </sl-icon-button>
        ${this.renderVideoSettings()}
        <sl-icon-button class='icon-button' id='fullscreen-button' src='${fullscreenEnter}' @click=${this.handleFullscreenClick}></sl-icon-button>
      </div>
    </div>`
  }

  renderInteractionTypeSelector() {
    return html`
    <sl-dropdown label='Interaction Type' id='interaction-type-dropdown' @sl-select=${this.handleInteractionTypeSelected}>
      <sl-button slot='trigger' id='interaction-type-button' caret>Interaction Type</sl-button>
      <sl-menu>
        <sl-menu-item value='1'>Replace</sl-menu-item>
        <sl-menu-item value='2'>Overlay</sl-menu-item>
      </sl-menu>
    </sl-dropdown>`
  }

  renderVideoSettings() {
    return html`
    <sl-dropdown placement='top-start' id='settings-menu' @sl-select=${this.settingSelectionHandler}>
      <sl-icon-button class='icon-button' id='settings-button' src='${gear}' slot='trigger'></sl-icon-button>
      <sl-menu>
        <sl-menu-item>
          Playback Speed
          <sl-menu slot='submenu'>
            <sl-menu-item value='0.25'>0.25x</sl-menu-item>
            <sl-menu-item value='0.5'>0.5x</sl-menu-item>
            <sl-menu-item value='1'>1x</sl-menu-item>
            <sl-menu-item value='1.5'>1.5x</sl-menu-item>
            <sl-menu-item value='2'>2x</sl-menu-item>
          <sl-menu>
        </sl-menu-item>
      </sl-menu>
    </sl-dropdown>`
  }

  renderReplaceInteractionSettings() {
    return html`
    <div id='replace-interaction-settings' hidden>
      <sl-input id='replace-timestamp' label='Timestamp' @sl-change=${this.handleTimeInputChange}></sl-input>
      <!-- container for the interactive elements -->
      <div id='interaction-container'>
        ${this.isContentEditable ? html`<slot name='interaction-slot' id='interaction-slot'> </slot>`: null}
        <div class='interaction-button-group'>
          <sl-button @click=${this.toggleInteractionView}> ${this.interactionActive? 'Return to Video' : 'View Interaction'} </sl-button>
          ${this.interactionActive ? html``: html`<sl-button variant='danger' @click=${this.deleteElement}> Delete </sl-button>`}
        </div>               
        <sl-button slot="footer" style="margin-top: 10px" variant="primary" @click=${this.closeDrawer}>Close</sl-button>
      </div>
    </div>`
  }

  renderOverlayInteractionSettings() {
    return html`
      <div id='overlay-interaction-settings' hidden>
        <sl-input id='overlay-start-time-input' label='Start Time' @sl-change=${this.handleTimeInputChange}></sl-input>
        <sl-input id='overlay-end-time-input' label='End Time' @sl-change=${this.handleTimeInputChange}></sl-input>
        <sl-textarea label='Content' id='overlay-content-input' @sl-change=${this.handleOverlayContentChange}></sl-textarea>
        <p> Color </p>
        <sl-color-picker label="Overlay Color" id='color-picker' @sl-change=${this.handleOverlayColorChange}></sl-color-picker>
        <sl-details style='margin-top:10px;' summary="Advanced Options">
          <sl-input label='X Position' 
                    id='overlay-x-position-input' 
                    type="number" 
                    @sl-change=${this.handleOverlayPositionChange}>
          </sl-input>
          <sl-input label='Y Position' 
                    id='overlay-y-position-input' 
                    type="number" 
                    @sl-change=${this.handleOverlayPositionChange}>
          </sl-input>
          <sl-input label='Width' 
                    id='overlay-width-input'  
                    type="number" 
                    @sl-change=${this.handleOverlaySizeChange}>
          </sl-input>
          <sl-input label='Height' 
                    id='overlay-height-input' 
                    type="number"
                     @sl-change=${this.handleOverlaySizeChange}>
          </sl-input>
        </sl-details>
        <div class='interaction-button-group' slot="footer">
          <sl-button  style="margin-top: 10px" variant="primary" @click=${this.closeDrawer}>Close</sl-button>
          ${this.interactionActive ? null : html`<sl-button style="margin-top: 10px" variant='danger' @click=${this.deleteElement}> Delete </sl-button>`}
        </div>
      </div>`
  }
  
  handleOverlayPositionChange(e: CustomEvent) {
    const input = e.target as SlInput;
    const value = parseFloat(input.value);
    if (!isNaN(value)) {
      const data = this.videoData.get(this.activeElement);
      data.position = data.position || { x: 0, y: 0 };
      if (input.label.toLowerCase() === 'x position') {
        data.position.x = value;
      } else if (input.label.toLowerCase() === 'y position') {
        data.position.y = value;
      }
      this.saveInteractionConfig();
      this.requestUpdate();
    }
  }
  
  handleOverlayContentChange(e: CustomEvent) {
    const textarea = e.target as SlTextarea;
    this.videoData.get(this.activeElement).content = textarea.value;
    this.saveInteractionConfig();
  }
  
  handleOverlaySizeChange(e: CustomEvent) {
    const input = e.target as SlInput;
    const value = parseFloat(input.value);
    if (!isNaN(value) && value > 0) {
      const data = this.videoData.get(this.activeElement);
      data.size = data.size || { width: 100, height: 100 };
      data.size[input.label.toLowerCase() as 'width' | 'height'] = value;
      this.saveInteractionConfig();
    }
  }

  deleteElement() {
    this.interactionSlot.assignedElements().forEach((element) => {
      if(element instanceof WwVideoInteraction && element.id === this.activeElement) {
        element.remove();
      }
    });
    this.videoData.delete(this.activeElement);
    //this.recalculateIndexes(activeId);
    this.saveInteractionConfig();
    this.closeDrawer();
    this.updateBaublePositions();
    this.requestUpdate();
  }



  updateBaublePositions() {
    if(!this.upperControls) return;
    const children = this.upperControls.children;
    Array.from(children).forEach((child: Element) => {
      if(child instanceof WwInteractiveBauble) {
        const id = parseInt(child.id);
        const data = this.videoData.get(id);
        if(data) {
          const newOffset = this.calculateOffset(data.startTime);
          if(newOffset !== undefined) {
            child.setAttribute('offset', `${newOffset}`);
          }
        }
      }
    });
    this.requestUpdate();
  }

  // MARK: deletion bug
  // one most deletions, interactions change their id automatically, why is this??
  // on some however, there is a gap. this gap bricks the program since it cannot match up with videodata anymore?
  // planned fix is to recalculate videodata (this function already works), and subsequently recalculate interaction IDs, so they match up again.
  // this should fix it regardless of wrong initial behavior but ideally obviously we wouldn't need that.

  /*recalculateIndexes(deletionID: number) {
    this.recalculateBaubleIndexes(deletionID);
    this.interactionSlot.assignedElements().forEach((element: WwVideoInteraction) => {
      console.log('element with id',element.id, 'being compared to',this.videoData.size)
      if(element.id > this.videoData.size) {
        this.recalculateInteractionIndexes(deletionID);
      }
    });
  }

  recalculateInteractionIndexes(deletionID: number) {
    console.log('i was invoked');
    this.interactionSlot.assignedElements().forEach((element: WwVideoInteraction) => {
      if(element.id > deletionID) element.setAttribute('id', `${element.id - 1}`);
    });
  }

  recalculateBaubleIndexes(deletionID: number) {
    const newData = Array.from(this.videoData.entries())
    .sort((a, b) => a[0] - b[0])
    .reduce((map, [_, value], index) => map.set(index + 1, value), new Map<number, videoData>());
    this.videoData = newData;
    WwInteractiveBauble.nextId = this.videoData.size +1 ;
  }*/


  toggleInteractionView() {
    if(this.interactionActive) {
      this.minimizeInteraction();
    } else {
      this.maximizeInteraction();
    }
  }

  /**
   * 
   * Minimizes the interaction container.
   */
  minimizeInteraction() {
    this.drawer.hide();
    this.interactionContainer.style.position = 'initial';
    this.interactionContainer.style.zIndex = '0';
    this.interactionContainer.style.backgroundColor = 'transparent';
    this.interactionContainer.style.left = '0';
    this.interactionContainer.style.width = '100%';
    this.interactionContainer.style.height = '30%';
    this.interactionContainer.style.color = 'black';
    this.interactionContainer.style.fontSize = '1em';
    this.interactionActive = false;
    this.interactionContainer.style.transform = 'translateX(7px)';
  }

  /**
   * Maximizes the interaction container and displays it on the screen.
   */
  maximizeInteraction = () => {
    this.drawer.open = true;
    this.overlayZIndex = 0;
    const rect = this.shadowRoot.querySelector('#container-vertical').getBoundingClientRect() as DOMRect;
    this.interactionContainer.style.position = 'fixed';
    this.interactionContainer.style.zIndex = '1000';
    this.interactionContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    this.interactionContainer.style.display = 'block';
    this.interactionContainer.style.color = 'white';
    this.interactionContainer.style.fontSize = '2em';
    for(const key in rect) {
      this.interactionContainer.style[key] = `${rect[key]}px`;
    }
    this.interactionContainer.style.transform = 'translateX(-20px)';
    this.interactionActive = true;
  }

  handleFullscreenClick = () => {
    if (document.fullscreenElement) {
      this.fullscreenButton.setAttribute('src',`${fullscreenEnter}`);
      document.exitFullscreen();
      this.removeEventListener('resize', this.handleFullscreenResize);
    }
    else {
      this.fullscreenButton.setAttribute('src',`${fullscreenExit}`);
      this.addEventListener('resize',this.handleFullscreenResize);
      this.requestFullscreen();
      // MARK: todo
      if(!this.checkControlsVisible()){
        this.makeControlsSticky();
      }
    }
  }

  makeControlsSticky(){
     
  }

  checkControlsVisible(): Boolean {
    if(window.innerHeight < this.offsetHeight) {
      console.log('controls not visible');
      return false;
    }
     return true;
  }

  handleFullscreenResize() {
    if(!this.checkControlsVisible) {
      this.makeControlsSticky();
    }
  }

  volumeButtonIconHelper() {
    if(this.video.muted) return;
    if(this.volumeSlider.value === 0) this.muteButton.setAttribute('src',`${volumeOff}`);
    else {
      this.volumeSlider.value < 50 ?  this.muteButton.setAttribute('src',`${volumeDown}`) 
                                      : this.muteButton.setAttribute('src',`${volumeUp}`) 
    }
  }

  settingSelectionHandler = (e: CustomEvent) => {
    if (!this.videoLoaded) return;
    this.video.playbackRate = e.detail.item.value;
  }

  seek(value: number) {
    if (!this.videoLoaded) return;
    this.video.currentTime += value;
  }

  /*
  * speichere den letzten wert und schau ob starttime übersprungen wurde
  */
  handleTimeUpdate = (e: CustomEvent) => {
    if(this.showInteractions || !this.isContentEditable) {
      this.replaceInteractionHelper();
    }
    this.lastTimeupdate = this.video.currentTime;
    this.progressBar.value = (this.video.currentTime / this.video.duration)*100;
    this.timeStamp.innerHTML = this.formatTime(this.lastTimeupdate) + '/' + this.videoDurationFormatted;
  }

  replaceInteractionHelper() {
    this.videoData.forEach((value, key) => {
      if(value.isReplace) {
        if(this.lastTimeupdate <= value.startTime && this.video.currentTime >= value.startTime) {
          if(this.activeElement != key) {
            this.changeActiveElement(key);
          }
          if(!this.video.paused)  {
            this.video.pause();
            this.playButton.setAttribute('src',`${play}`);
          }
          this.maximizeInteraction();
        }
      }
    });
  }

  handleProgressChange = (e: CustomEvent) => {
    const progressBar = e.target as SlRange;
    let currentTime = (progressBar.value / 100) * this.video.duration;
    this.video.currentTime = Math.floor(currentTime);
    this.timeStamp.value = this.formatTime(currentTime) + '/' + this.videoDurationFormatted;
  }

  connectedCallback() {
    super.connectedCallback();
    this.videoLoaded = false;
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    this.loadInteractionConfig();
    this.renderChaptersList();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
  }
  handleFullscreenChange = (event: Event) => {
    this.updateBaublePositions();
  }
  
  handleVolumeChange = (e: CustomEvent) => {
    const volumeSlider = e.target as SlRange;
    this.video.volume = volumeSlider.value / 100;
    this.volumeButtonIconHelper();
  }

  formatTime(time: number): string {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  videoToBase64(e: Event) {
    const fileInput = e.target as HTMLInputElement;
    const file = fileInput.files?.[0];
  
    if (!file) {
      console.error('No file selected');
      return;
    }
  
    const reader = new FileReader();
  
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result as string;
      if (result) {
        this.videoBase64 = result;
        this.setupVideo(result);
      }
    };
  
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
    };
  
    reader.readAsDataURL(file);
  }
  
  setupVideo(src: string) {
    this.video = document.createElement('video');
    this.video.src = src;
    this.video.style.width = '100%';
    this.video.addEventListener('loadedmetadata', this.handleMetadataLoaded);
    this.video.addEventListener('canplaythrough', this.handleCanPlayThrough);
    this.video.addEventListener('timeupdate', this.handleTimeUpdate);
    this.video.addEventListener('click', this.handleVideoClick);
  }
  
  handleVideoClick = (e: MouseEvent) => {
    if (!this.videoLoaded) return;
    e.stopPropagation();
    this.startStopVideo();
  }

  startStopVideo() {
    if (!this.videoLoaded) return;
    if (this.video.ended) {
      this.video.currentTime = 0;
    }
    if(this.video.paused) {
      this.video.play();
      this.playButton.setAttribute('src',`${pause}`)
    }  else {
      this.video.pause();
      this.playButton.setAttribute('src',`${play}`)
    }
  }

  closeDrawer() {
    if (!this.videoLoaded) return;
    this.overlayZIndex = 50;
    this.drawer.open = false;
  }

  handlePlayClick = (e: CustomEvent) => {
    this.startStopVideo()
  }

  renderOverlays() {
    if(!this.showOverlay && this.isContentEditable) return;
    return Array.from(this.videoData.entries())
      .filter(([_, data]) => !data.isReplace)
      .map(([id, data]) => {
        if (this.video.currentTime >= data.startTime && this.video.currentTime <= data.endTime) {
          return html`
            <div class="overlay-interaction" 
                 id="overlay-${id}"
                 @mousedown="${this.startDragging}"
                 @click="${this.handleOverlayClicked}"
                 style="position: absolute;
                        left: ${data.position?.x || 0}px; 
                        top: ${data.position?.y || 0}px; 
                        width: ${data.size?.width || 100}px; 
                        height: ${data.size?.height || 100}px;
                        z-index: ${this.overlayZIndex};
                        background-color: ${data.color || '#ffffff'};
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        padding: 10px;
                        overflow: hidden;">
              <p style="margin: 0; color: ${this.getContrastColor(data.color || '#ffffff')};">${(data.content || '')}</p>
              <sl-icon style="position: absolute; 
                              bottom: 5px; 
                              right: 5px; 
                              color: ${this.getContrastColor(data.color || '#ffffff')};"  
                              @mousedown="${this.startResizing}" 
                              src=${resize}>
              </sl-icon>
            </div>
          `;
        }
        return null;
      });
  }

  getContrastColor(hexColor: string): string {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  handleOverlayClicked = (event: MouseEvent) => {
    event.stopPropagation();
    if(this.isDragging){
      this.isDragging = false;
      return;
    }
    this.clickEventHelper(parseInt((event.currentTarget as HTMLElement).id.split('-')[1]));
  }

  startDragging(e: MouseEvent) {
    if(this.drawer.open) return;
    const overlay = e.currentTarget as HTMLElement;
    const startX = e.clientX - overlay.offsetLeft;
    const startY = e.clientY - overlay.offsetTop;
  
    const onMouseMove = (e: MouseEvent) => {
      this.isDragging = true;

      let newX = e.clientX - startX;
      let newY = e.clientY - startY;
      
      // Constrain to video boundaries
      const videoRect = this.video.getBoundingClientRect();
      newX = Math.max(0, Math.min(newX, videoRect.width - overlay.offsetWidth));
      newY = Math.max(0, Math.min(newY, videoRect.height - overlay.offsetHeight));
  
      overlay.style.left = `${newX}px`;
      overlay.style.top = `${newY}px`;
  
      // Update videoData
      const id = parseInt(overlay.id.split('-')[1]);
      this.videoData.get(id).position = { x: newX, y: newY };
    };
  
    const onMouseUp = (e: MouseEvent) => {
      e.stopPropagation();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      this.saveInteractionConfig();

    };
  
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }
  
  startResizing(e: MouseEvent) {
    if(this.drawer.open) return;
    if(!(e.target as HTMLElement).matches('sl-icon')) return;
    e.stopPropagation();
    const overlay = (e.currentTarget as HTMLElement).parentElement as HTMLElement;
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = overlay.offsetWidth;
    const startHeight = overlay.offsetHeight;
  
    const onMouseMove = (e: MouseEvent) => {
      this.isDragging = true;
      let newWidth = startWidth + e.clientX - startX;
      let newHeight = startHeight + e.clientY - startY;
      
      // Constrain to video boundaries
      const videoRect = this.video.getBoundingClientRect();
      newWidth = Math.min(newWidth, videoRect.width - overlay.offsetLeft);
      newHeight = Math.min(newHeight, videoRect.height - overlay.offsetTop);
  
      overlay.style.width = `${newWidth}px`;
      overlay.style.height = `${newHeight}px`;
  
      // Update videoData
      const id = parseInt(overlay.id.split('-')[1]);
      this.videoData.get(id).size = { width: newWidth, height: newHeight };
    };
  
    const onMouseUp = (e: MouseEvent) => {
      e.stopPropagation();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      this.saveInteractionConfig();
    };
  
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  handleCanPlayThrough = () => {
    if (this.videoLoaded) return;
    this.videoLoaded = true;
  
    setTimeout(() => {
      if (this.addButton) {
        this.addButton.disabled = !this.isContentEditable;
      }
  
      if (this.progressBar) {
        this.progressBar.value = 0;
      }
  
      if (this.video) {
        this.video.volume = 0.1;
      }
  
      if (this.volumeSlider) {
        this.volumeSlider.value = 10;
      }
  
      if (this.hasChapters && JSON.parse(this.chapterConfig).length === 0) {
        this.chapterConfig = JSON.stringify([{
          title: 'Chapter 1',
          startTime: 0
        }]);
      }
  
      this.requestUpdate();

    }, 0);
  }

  handleMetadataLoaded = () => {
    this.videoDurationFormatted = this.formatTime(this.video.duration);
    
    setTimeout(() => {
      if (this.progressBar) {
        this.progressBar.max = 100;
        this.progressBar.tooltipFormatter = (value: number) => {
          return this.formatTime(Math.floor((value / 100) * this.video.duration));
        };
      }
  
      if (this.timeStamp) {
        this.timeStamp.innerHTML = `00:00/${this.videoDurationFormatted}`;
      }
  
      this.requestUpdate();
    }, 0);
  }

  renderFileInputArea() {
    return html`
    <div id="file-input-area" 
    @dragover=${this.handleDragOverFileInputArea}
    @drop=${this.handleDropOnFileInputArea}>  
      <input name="fileInput" id="fileInput" type="file" accept="video/*" @change=${this.handleFileInput} />
      <p>Drag & drop a video file here or click to select a file</p>
      <textarea>http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4</textarea>
    </div>
    <sl-input id="url-input" placeholder="Enter video URL" @sl-change=${this.handleUrlInput}></sl-input>`
  }

  renderInteractiveBaubles() {
    return html`
    <div  id='drop-area' 
          @drop=${this.handleBaubleDroppedOnDropArea} 
          @dragover=${this.handleBaubleDraggedOverDropArea} 
          @dragleave=${this.handleBaubleLeaveDropArea}>
      <div id='controls-upper'>
        ${Array.from(this.videoData.entries()).map(([key, value]) => {
          return value.isReplace ? html`
          <webwriter-interactive-bauble style='transform: translateY(-2px); border-radius: 50%;'
                                    offset=${this.calculateOffset(value.startTime)}
                                    @dragstart=${this.handleBaubleDragStart}
                                    @dragend=${this.handleBaubleDragEnd} 
                                    draggable="true"
                                    @click=${this.handleBaubleClick} 
                                    id=${key}>
          </webwriter-interactive-bauble>`
          : html`
          <webwriter-interactive-bauble style='transform: translateY(-2px);'
                                    offset=${this.calculateOffset(value.startTime)}
                                    @dragstart=${this.handleBaubleDragStart}
                                    @dragend=${this.handleBaubleDragEnd} 
                                    draggable="true"
                                    @click=${this.handleBaubleClick} 
                                    id=${key}>
          </webwriter-interactive-bauble>`;
        })}
      </div>
    </div>`
  }

  handleBaubleDroppedOnDropArea(e: DragEvent) {
    const rect = this.dropArea.getBoundingClientRect();
    const distanceFromLeft = e.clientX - rect.left;
    this.overlayStartTimeInput
    this.replaceTimestamp
    this.baubleTimeUpdateHelper(Math.floor(this.video.duration * (distanceFromLeft/rect.width)), 
                                parseInt(e.dataTransfer.getData('id')), 
                                this.videoData.get(parseInt(e.dataTransfer.getData('id'))).isReplace? this.replaceTimestamp
                                : this.overlayStartTimeInput);
    this.videoData.get(parseInt(e.dataTransfer.getData('id'))).startTime = Math.floor(this.video.duration * (distanceFromLeft/rect.width));
    this.saveInteractionConfig();
    this.updateBaublePositions();
    this.dropArea.style.background =  'none';
    this.changeTrashToAdd();
    this.changeActiveElement(parseInt(e.dataTransfer.getData('previousActive')));
    this.requestUpdate();
  }
  

  handleBaubleDroppedOnAdd(e: DragEvent) {
    this.dropArea.style.background =  'none';
    this.deleteElement();
    this.changeActiveElement(parseInt(e.dataTransfer.getData('previousActive')));
    this.changeTrashToAdd();
  }

  handleBaubleDraggedOverDropArea(e: DragEvent) {
    this.dropArea.style.background = 'rgba(0.5,0.5,0.5,0.5)'
  }

  handleBaubleLeaveDropArea(e: DragEvent) {
    this.dropArea.style.background =  'none'
  }

  handleBaubleDragEnd = (e:DragEvent) => {
    this.changeActiveElement(parseInt(e.dataTransfer.getData('previousActive')));
    this.dropArea.style.background =  'none'
    this.addButton.setAttribute('src',`${add}`)
    this.addButton.style.color = 'hsl(200.4 98% 39.4%)';
  }

  handleMuteClick = (e: CustomEvent) => {
    if (!this.videoLoaded) return;
    const t = e.target as SlButton;
    if(this.video.muted) {
      this.video.muted = false;
      this.volumeButtonIconHelper();
    } else {
      this.video.muted = true;
      this.muteButton.setAttribute('src',`${volumeMute}`)
    }
  }

  handleOverlayColorChange(e: CustomEvent) {
    const colorPicker = e.target as SlColorPicker;
    const data = this.videoData.get(this.activeElement);
    if (data) {
      data.color = colorPicker.value;
      this.saveInteractionConfig();
    }
  }
}  

// TODOS:

// ids of interactions and baubles are not the same
// bauble id recalculaten on deletion

// sticky controls in fullscreen mode

// after shifting cards change focus to "old" element and put cursor there

// sort functions by use (all render functions, then all event handlers etc.) or by theme (all overlay functions, then all replace functions, chapter functions etc.)
// choose which methods should only be applicable when content is editable