// Renders the gadget
function stateChangeHandler() {
    // Get state
    if (!wave.getState()) {
        return;
    }
    var state = wave.getState();
}
function partcipantChangeHandler(){
  // Get state
    if (!wave.getState()) {
        return;
    }
    var state = wave.getState();
}
function init() {
    if (wave && wave.isInWaveContainer()) {
      // Loads the gadget's initial state and the subsequent changes to it
        wave.setStateCallback(stateChangeHandler);
        
        // Loads participants and any changes to them
        wave.setParticipantCallback(partcipantChangeHandler);
        console.log("wave state loaded")
    }
    
}

// Initializes gadget after receiving a notification that the page is loaded and the DOM is ready.
gadgets.util.registerOnLoadHandler(init);


