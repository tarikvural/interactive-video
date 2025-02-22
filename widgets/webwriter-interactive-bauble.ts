import { html, css, PropertyValueMap, LitElement } from "lit"
import { LitElementWw } from "@webwriter/lit"
import { customElement, property, query } from "lit/decorators.js"


/**
 * `webwriter-interactive-bauble` is a custom element that represents a draggable bauble to display interactions on the progress bar.
 * It extends `LitElementWw` and provides properties to manage positioning.
 */
@customElement("webwriter-interactive-bauble")
export class WwInteractiveBauble extends LitElementWw {

    /**
     * CSS styles for the component.
     * Defines the appearance of the bauble.
     */
    static styles = css`
        :host {
            width: 20px;
            height: 20px;
            background-color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: grab;
            position: absolute;
        }
        
        :host(.dragging) {
            cursor: grabbing;
        }
    `;

    /**
     * Unique identifier for the bauble.
     * This property is reflected as an attribute.
     */
    @property({ type: Number , attribute: true, reflect: true})
    id;

    /**
     * Initial offset of the bauble.
     * This property is reflected as an attribute.
     */
    @property({ type: Number, attribute: true, reflect: true})
    initialOffset;

    /**
     * Offset of the bauble, this property is used to update the position of the bauble.
     * This property is reflected as an attribute.
     */
    @property({ type: Number, attribute: true, reflect: true})
    offset; 

    /**
   * Lifecycle method called after the component's first update.
   * Sets the initial position of the bauble based on the `initialOffset` property.
   * 
   * @param _changedProperties - Map of changed properties with their previous values.
   */
    protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        this.style.left = `${this.initialOffset}px`;
    }


    /**
     * Lifecycle method called when the component is updated.
     * Updates the position of the bauble based on the `offset` property.
     * 
     * @param changedProperties - Map of changed properties with their previous values.
     */
    updated(changedProperties) {
        changedProperties.forEach((_oldValue, property) => {
            if (property == 'offset') {
                this.style.left = `${this.offset}px`;
            }
        });
    }

    /**
     * Renders the component's template.
     * Displays the bauble's ID inside a paragraph element.
     * 
     * @returns The HTML template for the component.
     */
    render() {
        return html`
            <p style="pointer-events: none;">${this.id}</p>
        `;
    }
}
