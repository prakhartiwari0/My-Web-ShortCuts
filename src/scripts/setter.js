
import './styles/mws.css'

import { finder } from '@medv/finder'

import { toJSON } from '../modules/domJsonConverter.js'

import {
    addClass, rmClass, getElemAt, setTextContent, setInnerHTML, getAttr, setAttr, setEvent, rmEvent,
    qS, qSA, apCh, getStorage, setStorage, sendMsg, getTextContent
} from "../modules/quickMethods.js"

import elementCreator from '../modules/elementCreator'


const mws = {
    // dom: {
    //     addClass: (element, classesArray = []) => {

    //         classesArray.forEach((cls) => {
    //             return element.classList.add(cls)
    //         })
    //     },
    //     rmClass: (element, classesArray = []) => {
    //         classesArray.forEach((cls) => {
    //             return element.classList.remove(cls)
    //         })
    //     },
    //     getElemAt: (x, y) => {
    //         return document.elementFromPoint(x, y)
    //     },

    //     setTextContent: (element, text = "") => {
    //         element.textContent = text
    //     },
    //     setInnerHTML: (element, html = "") => {
    //         element.innerHTML = html
    //     },



    //     getAttr: (element, attribute = "") => {
    //         return element.getAttribute(attribute)
    //     },
    //     setAttr: (element, attribute = "", value = "") => {
    //         element.setAttribute(attribute, value)
    //     },

    //     setEvent: (element, eventName = "", callbackFunc, options = {}) => {
    //         element.addEventListener(eventName, (e) => {
    //             callbackFunc(e);
    //         }, options)
    //     },
    //     rmEvent:(element, eventName, functionAttached, options={}) =>{
    //         element.removeEventListener(eventName, functionAttached, options)
    //     }
    // },


    // doc: {
    //     qS: (selector) => {
    //         return document.querySelector(selector)
    //     },
    //     qSA: (selector) => {
    //         return document.querySelectorAll(selector)
    //     },
    //     apCh: (child) => {
    //         document.appendChild(child)
    //         return true
    //     }
    // },

    // chrome: {
    //     getStorage: function (keys = [], area="local",returnPromise = false) {
    //         if (area=="sync") {
    //             return returnPromise ? chrome.sync.local.get(keys) : chrome.sync.local.get(keys).then((data) => data)
    //         }
    //         else if(area=="session"){
    //             return returnPromise ? chrome.storage.session.get(keys) : chrome.storage.session.get(keys).then((data) => data)
    //         }
    //         return returnPromise ? chrome.local.session.get(keys) : chrome.local.session.get(keys).then((data) => data)
    //     },
    //     setStorage: function (keyValues = {}, area="local",returnPromise = false) {
    //         if (area=="sync") {
    //             return returnPromise ? chrome.storage.sync.set(keyValues) : chrome.storage.sync.set(keyValues).then((data) => data)
    //         }
    //         else if(area=="session"){
    //             return returnPromise ? chrome.storage.session.set(keyValues) : chrome.storage.session.set(keyValues).then((data) => data)
    //         }
    //         return returnPromise ? chrome.storage.local.set(keyValues) : chrome.storage.local.set(keyValues).then((data) => data)
    //     },
    //     sendMsg: async (message) => {
    //         const response = await chrome.runtime.sendMessage(message);
    //         return response
    //     },
    // },

    currentState: {
        elementSelectionOn: false,
        elementSelectorOpen: false,
        keyboardShortcutSelectorOpen: false,
        keyboardShortcutSelectionOn: false,

    },

    currentElement: null,
    clickedElementsArray: [],
    selectedShortcut: undefined,
    shortcutName: "",
    allShortcuts: [], // {"website":["shortcut", "shortcut"]}
    keyElementRelationObject: {},
    /*

    keyElementRelationObject =
    // {
        "website":{
            Single Element or Multiple Elements or Location on View Screen
            "shortcut":{
                type:"",
                properties:{
    
                },

                selected: {elementJSON} OR [{elementJSON}, {elementJSON}...] OR {x:20, y:20},

            }
            



        }
    }

    */


    /*

    */

    keyboarder: function (e) {
        e.preventDefault()
        let pressedKey = e.key;

        if (mws.currentState.keyboardShortcutSelectionOn) {
            mws.selectedShortcut = pressedKey
            setTextContent(qS('.MWS-selectedShortcutSpan'), `${mws.selectedShortcut}`)
        }
    },
    turnOnKeyboarder: () => {
        // keypress only listens to Character Key Presses and not all key presses like CTRL, Tab, F1, etc. (keydown detects all)
        // This is done to prevent any issues with pre-existing shortcuts in the browser or the OS. It may be removed 
        // with some measures in the future.
        window.addEventListener('keypress', mws.keyboarder)
    },
    turnOffKeyboarder: () => {
        window.removeEventListener('keypress', mws.keyboarder)
    },


    addRemoveborder: function (event) {
        // This function will add or Remove a class to the hovered element that gives it a border 
        let [x, y] = [event.x, event.y]


        if (mws.currentState.keyboardShortcutSelectorOpen) {
            return
        }
        if (!mws.currentState.elementSelectionOn) {
            return
        }

        // If currentElement already exists then remove the class
        if (mws.currentElement) {
            mws.currentElement.classList.remove('MWS-bordered')
        }

        if (getElemAt(x, y).classList.contains('MWS-element')) {
            mws.currentElement = undefined
            console.log("ignored");
            return
        }
        mws.currentElement = getElemAt(x, y);
        // mws.currentElement.classList.add('MWS-bordered')
        setTextContent(qS('.MWS-currentElementSpan'), finder(mws.currentElement))

        addClass(mws.currentElement, ['MWS-bordered'])

        // console.log(mws.currentElement);
        // console.log(finder(mws.currentElement));

    },

    closeKeyboardShortcutSelectionDialog: function () {
        // mws.switchOffSelector()
        const dialogElement = qS('.MWS-keyboardShortcutSelectionDialog')
        document.body.removeChild(dialogElement)
        mws.currentState.keyboardShortcutSelectorOpen = false;

        // mws.openFloatingDiv()
    },

    enableNameSetting: function () {
        mws.currentState.keyboardShortcutSelectionOn = false;
        mws.turnOffKeyboarder()
        const nameInput = qS('.MWS-shortcutNameInput')
        nameInput.disabled = false

        setEvent(nameInput, "keyup", (e) => {
            mws.shortcutName = nameInput.value
        })

    },


    keyboardShortcutValidator: function (shortcutsArray = []) {
        // This function will be updated a lot with time as we get to know shortcuts that are causing issues for MOST of the users.
        // Note that there will be specific issues for every user which they need to solve themselves. But there are a few shortcuts
        // that are universally used for something and can be an issue. 
        return true
    },
    openKeyboardShortcutSelectionDialog: function () {
        mws.turnOnKeyboarder()

        mws.currentState.keyboardShortcutSelectorOpen = true;
        mws.currentState.keyboardShortcutSelectionOn = true;
        let dialogElementData = {
            tagName: 'dialog',
            attributes: {
                classes: ['MWS-element', 'MWS-keyboardShortcutSelectionDialog']
            },
            // childElements: [spanElement, buttonElement]
            innerHTML: `
	<button class="MWS-element MWS-closeKeyboardShortcutSelectionDialogButton">
		Close
	</button>
	<p class="MWS-element MWS-shortcutShowupPara">
		Selected Shortcut:
		<span class="MWS-element MWS-selectedShortcutSpan">None</span>
	</p>
	<button class="MWS-element MWS-shortcutSelectionDoneButton">Select Shortcut</button>

	<label for="shortcutName" class="MWS-element MWS-ShortcutNameLabel"
		>Shortcut Name:
	</label>
	<input
		type="text"
		id="shortcutName"
		maxlength="20"
		class="MWS-element MWS-shortcutNameInput"
        disabled="true" />

		
		<button class="MWS-element MWS-allDoneButton">Done</button>
            `
        }
        let dialogElement = elementCreator(dialogElementData)
        document.body.appendChild(dialogElement)


        qS('.MWS-shortcutSelectionDoneButton').addEventListener('click', (e) => {
            e.preventDefault()
            if (mws.keyboardShortcutValidator([mws.selectedShortcut])) {
                console.log(mws.selectedShortcut);
                mws.enableNameSetting()
            }
        })

        qS('.MWS-allDoneButton').addEventListener('click', async (event) => {
            event.preventDefault()
            if (mws.selectedShortcut == undefined) { return }

            if (!mws.allShortcuts.includes(mws.selectedShortcut)) {
                mws.allShortcuts.push(mws.selectedShortcut)
            }
            mws.keyElementRelationObject[mws.selectedShortcut] = toJSON(mws.currentElement)


            const result = await getStorage(["elementShortcutsRelation", 'allSetShortcutsArray'])

            let previousData = {
                allSetShortcutsArray: result.allSetShortcutsArray ? result.allSetShortcutsArray : [],
                elementShortcutsRelation: result.elementShortcutsRelation ? result.elementShortcutsRelation : {}
            }

            let updatedData = {
                allSetShortcutsArray: (previousData.allSetShortcutsArray).concat(mws.allShortcuts),
                keyElementRelationObject: { ...previousData.elementShortcutsRelation, ...mws.keyElementRelationObject }
            }

            await setStorage({ elementShortcutsRelation: updatedData.keyElementRelationObject, allSetShortcutsArray: updatedData.allSetShortcutsArray })

            chrome.runtime.sendMessage({ msg: "NewShortcuts" });
            // chrome.runtime.sendMessage({ action: "turnOffSelector" });



            rmClass(mws.currentElement, ['MWS-bordered'])
            mws.currentElement = undefined;

            // mws.currentState.keyboardShortcutSelectorOpen = false

            // mws.turnOffEverything()

            mws.closeKeyboardShortcutSelectionDialog()
        })

        setEvent(qS('.MWS-closeKeyboardShortcutSelectionDialogButton'), 'click', (event) => {
            event.preventDefault()
            rmClass(mws.currentElement, ['MWS-bordered'])
            mws.currentElement = undefined;

            mws.closeKeyboardShortcutSelectionDialog()
        })

        dialogElement.showModal()
    },


    whenClicked: function (event) {
        if (!mws.currentState.elementSelectionOn) { 
            return
            
        }
        event.preventDefault()
        const clickedElement = mws.currentElement;

        if (!mws.currentElement) {
            return
        }

        if (clickedElement.classList.contains('MWS-element')) {
            return
        }

        if (!mws.currentState.keyboardShortcutSelectorOpen) {
            // mws.closeFloatingDiv()
            mws.openKeyboardShortcutSelectionDialog()
        }

        // This code will be there when multiple click functionality is added

        // clickedElement.classList.add("MWS-clicked")
        // if (!clickedElementsArray.contains(mws.currentElement)) {
        //     clickedElementsArray.push(mws.currentElement)
        //     mws.currentElement.setAttribute('data-index', `${clickedElementsArray.length}`)
        // }

    },

    switchOffSelector: function () {
        mws.currentState.elementSelectionOn = false
        mws.currentElement=undefined
        rmClass(qS('html'), ['MWS-stylesForPage'])

        window.removeEventListener('mouseover', mws.addRemoveborder);
        window.removeEventListener('click', mws.whenClicked);

        setTextContent(qS('.MWS-elementSelectionEnableDisableButton'), mws.currentState.elementSelectionOn ? "On" : "Off")


    },
    switchOnSelector: function () {
        mws.currentState.elementSelectionOn = true
        addClass(qS('html'), ['MWS-stylesForPage'])

        window.addEventListener('mouseover', mws.addRemoveborder);
        window.addEventListener('click', mws.whenClicked);

        setTextContent(qS('.MWS-elementSelectionEnableDisableButton'), mws.currentState.elementSelectionOn ? "On" : "Off")
    },

    closeFloatingDiv: () => {
        document.body.removeChild(qS('.MWS-floatingDiv'))
    },

    makeElementDraggable: function (element) {

        let offsetX, offsetY;

        const move = (e) => {
            e.preventDefault()
            element.style.left = `${e.x - offsetX}px`
            element.style.top = `${e.y - offsetY}px`
            // mws.switchOffSelector()
        }
        element.addEventListener("mousedown", (e) => {
            offsetX = e.x - element.offsetLeft;
            offsetY = e.y - element.offsetTop;
            document.addEventListener("mousemove", move)

            // setEvent(document, "mousemove", move)
        })
        function mouseUpFunc(){
            rmEvent(document, "mousemove", move)
            // mws.switchOnSelector()
        }
        document.addEventListener("mouseup", mouseUpFunc)

        // element.addEventListener('mouseleave', ()=>{
        //     document.removeEventListener("mouseup", mouseUpFunc)
        // })
    },


    openFloatingDiv: function () {

        let floatingDivData = {
            tagName: 'div',
            attributes: {
                classes: ['MWS-element', 'MWS-floatingDiv']
            },
            innerHTML: `
	<button class="MWS-element MWS-elementSelectionEnableDisableButton">On</button>
	<p class="MWS-element MWS-selectedElementPara">
		Select Element: <span class="MWS-element MWS-currentElementSpan">currentElement</span>
	</p>
	<button class="MWS-element MWS-closeElementSelectorButton">Close</button>
            `
        }
        let floatingDiv = elementCreator(floatingDivData)
        document.body.appendChild(floatingDiv)

        mws.makeElementDraggable(floatingDiv)

        setEvent(qS('.MWS-elementSelectionEnableDisableButton'), 'click', (event) => {
            if (mws.currentState.elementSelectionOn) {
                mws.currentState.elementSelectionOn = false
                // setTextContent(qS('.MWS-elementSelectionEnableDisableButton'), "Off")
                mws.turnOffEverything()
            }
            else {
                // setTextContent(qS('.MWS-elementSelectionEnableDisableButton'), "On")
                mws.currentState.elementSelectionOn = true
                mws.turnOnEverything()
            }
            setTextContent(qS('.MWS-elementSelectionEnableDisableButton'), mws.currentState.elementSelectionOn ? "On" : "Off")

        })

        setEvent(qS('.MWS-closeElementSelectorButton'), 'click', (event) => {
            mws.turnOffEverything()
            mws.closeFloatingDiv()
            // document.body.removeChild(floatingDiv)
        })

        // dialogElement.showModal()


    },
    turnOffEverything: function () {
        mws.switchOffSelector()
        mws.turnOffKeyboarder()
    },
    turnOnEverything: function () {
        mws.switchOnSelector()
        mws.turnOnKeyboarder()
    },

    init: function () {
        mws.switchOnSelector()
        // mws.turnOnKeyboarder()

        mws.openFloatingDiv()

        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.message === "turnOffSelector") {
                mws.switchOffSelector()
            }
            if (message.message === "turnOOnSelector") {
                mws.switchOnSelector()
            }
        });

    }
}

mws.init()




// ----------ORIGINAL CODE-----------------------------------

// let currentState = {
//     elementSelectionOn: false,
//     keyboardShortcutSelectorOpen: false

// }

// let clickedElementsArray = [];

// let selectedShortcut;


// let allShortcuts = []
// let keyElementRelationObject = {}


// function keyboarder() {

//     window.addEventListener('keydown', (e) => {
//         e.preventDefault()
//         let pressedKey = e.key;
//         console.log(e);

//         if (currentState.keyboardShortcutSelectorOpen) {
//             selectedShortcut = pressedKey
//             document.querySelector('.MWS-dialogSpan').textContent="Selected Shortcut: "+ selectedShortcut
//         }


//     })


// }



// function highlighter() {


//     function getElementOnCoordinates(x, y) {
//         return document.elementFromPoint(x, y)
//     }

//     let currentElement;

//     function addRemoveborder(event) {
//         let [x, y] = [event.clientX, event.clientY]


//         if (currentState.keyboardShortcutSelectorOpen) {
//             return
//         }

//         if (currentElement) {
//             currentElement.classList.remove('MWS-bordered')
//         }

//         // console.log(getElementOnCoordinates(x, y));
//         // console.log(getElementOnCoordinates(x, y).classList);
//         // console.log(getElementOnCoordinates(x, y).classList.contains('MWS-element'));

//         if (getElementOnCoordinates(x, y).classList.contains('MWS-element')) {
//             console.log("ignored");
//             return
//         }
//         currentElement = getElementOnCoordinates(x, y);


//         // console.log(finder(currentElement));

//         // console.log(toJSON(currentElement));

//         // console.log(toDOM(toJSON(currentElement)));


//         currentElement.classList.add('MWS-bordered')


//     }

//     function selectKeyboardShortcut() {
//         // console.log(`Dialog opener function just started: ${currentElement}`);

//         currentState.keyboardShortcutSelectorOpen = true;


//         // let elementData = {
//         //     tagName: "div",
//         //     attributes: {
//         //         classes: ['MWS-element'],
//         //         id: undefined,
//         //         otherAttributes: []
//         //     },
//         //     textContent: undefined,
//         //     innerHTML: undefined,
//         //     childElements: []
//         // }


//         let spanElementData = {
//             tagName: 'span',
//             attributes: {
//                 classes: ['MWS-element', "MWS-dialogSpan"]
//             },
//             textContent: `Selected the keyboard shortcut: ${selectedShortcut}`
//         }
//         let spanElement = elementCreator(spanElementData)

//         let buttonElementData = {
//             tagName: 'button',
//             attributes: {
//                 classes: ["MWS-element", "MWS-dialogButton"]
//             },
//             textContent: "Done"
//         }
//         let buttonElement = elementCreator(buttonElementData)

//         buttonElement.addEventListener('click',(event)=>{
//             event.preventDefault()
//             if (selectedShortcut==undefined) {
//                 return
//             }

//             if (!allShortcuts.contains(selectedShortcut)) {
//                 allShortcuts.push(selectedShortcut)
//             }
//             keyElementRelationObject[selectedShortcut] = toJSON(currentElement)

//             console.log(allShortcuts);
//             console.log(keyElementRelationObject);

//             chrome.storage.local.get(["elementShortcutsRelation", 'allSetShortcutsArray']).then((result) => {

//                 let previousData = {
//                     allSetShortcutsArray: result.allSetShortcutsArray ? result.allSetShortcutsArray : [],
//                     elementShortcutsRelation: result.elementShortcutsRelation ? result.elementShortcutsRelation : {}
// }


//                 let updatedData = {
//                     allSetShortcutsArray: (previousData.allSetShortcutsArray).concat(allShortcuts),
//                     keyElementRelationObject: { ...previousData.elementShortcutsRelation, ...keyElementRelationObject }
//                 } 
//                 chrome.storage.local.set({ elementShortcutsRelation: updatedData.keyElementRelationObject }).then(() => {
//                     console.log("Relations are set");
//                     chrome.storage.local.set({ allSetShortcutsArray: updatedData.allSetShortcutsArray }).then(() => {
//                         console.log("List of Set Shorcuts is set");
//                     });
//                 });
//             });




//     //  chrome.runtime.sendMessage({ message: "NewShortcuts"});
//             (async () => {
//                 const response = await chrome.runtime.sendMessage({ msg: "NewShortcuts" });
//                 // do something with response here, not outside the function
//                 console.log(response);
//             })();




//             currentElement.classList.remove('MWS-clicked')
//             currentElement = undefined;
//             dialogElement.close()
//             currentState.keyboardShortcutSelectorOpen = false

//             switchOffSelector()
//             document.body.removeChild(dialogElement)
//         })


//         let dialogElementData = {
//             tagName: 'dialog',
//             attributes: {
//                 classes: ['MWS-element', 'MWS-keyboardShortcutSelectionDialog']
//             },
//             childElements: [spanElement, buttonElement]
//         }


//         let dialogElement = elementCreator(dialogElementData)

//         // console.log(`Before Appending: ${currentElement}`);

//         document.body.appendChild(dialogElement)
//         // console.log(`After Appending: ${currentElement}`);
//         dialogElement.showModal()
//         // console.log(`After ShowModal: ${currentElement}`);
//     }


//     function whenClicked(event) {
//         const clickedElement = currentElement;

//         if (!currentElement) {
//             return              
//         }

//         if (clickedElement.classList.contains('MWS-element')) {
//             return
//         }

//         event.preventDefault()
//         clickedElement.classList.add("MWS-clicked")


//         if (!currentState.keyboardShortcutSelectorOpen) {
//             // console.log(`Before calling the dialog opener function: ${currentElement}`);
//             selectKeyboardShortcut()            
//         }

//         // This code will be there when multiple click functionality is added
//         // if (!clickedElementsArray.contains(currentElement)) {
//         //     clickedElementsArray.push(currentElement)
//         //     currentElement.setAttribute('data-index', `${clickedElementsArray.length}`)
//         // }

//     }


//     window.addEventListener('mouseover', addRemoveborder);

//     window.addEventListener('click', whenClicked)


// function switchOffSelector() {

//     window.removeEventListener('mouseover', addRemoveborder);
//     window.removeEventListener('click', whenClicked);
// }

//     // Listen for messages sent from the background script.
//     chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//         if (message.message === "start") {
//             // toBeOrNotToBe = true
//         }
//         else {
//             // toBeOrNotToBe = false
//             switchOffSelector()
//         }
//     });

// }

// highlighter()
// keyboarder()

// ----------ORIGINAL CODE-----------------------------------

