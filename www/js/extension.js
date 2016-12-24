AutodeskNamespace('Viewing.ClassroomTrainning');

Viewing.ClassroomTrainning.Extension = function( viewer, option ){
    Autodesk.Viewing.Extension.call( this, viewer, option );  
    _viewer = viewer;
    _self = this;
};


Viewing.ClassroomTrainning.Extension.prototype = Object.create(Autodesk.Viewing.Extension.prototype);
Viewing.ClassroomTrainning.Extension.prototype.constructor = Viewing.ClassroomTrainning.Extension;


Viewing.ClassroomTrainning.Extension.prototype.onToolbarCreated = function(e){
    console.log('toolbar created event is called');
    _viewer.removeEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, _self.onToolbarCreated);
    _self.createMyUI();
};


Viewing.ClassroomTrainning.Extension.prototype.createToggler = function (button, click, unclick) {
    return function () {
        var state = button.getState();
        if (state === Autodesk.Viewing.UI.Button.State.INACTIVE) {
            button.setState(Autodesk.Viewing.UI.Button.State.ACTIVE);
            click();
        } else if (state === Autodesk.Viewing.UI.Button.State.ACTIVE) {
            button.setState(Autodesk.Viewing.UI.Button.State.INACTIVE);
            unclick();
        }
    };
};


Viewing.ClassroomTrainning.Extension.prototype.screenPointToHitPoint = function( screenPoint ){
    var viewport = _viewer.navigation.getScreenViewport();
    var n = {
        x: ( screenPoint.x - viewport.left)/viewport.width,
        y: ( screenPoint.y - viewport.top)/viewport.height
    };

    var hitPoint = _viewer.utilities.getHitPoint( n.x, n.y );
    return hitPoint;
};



Viewing.ClassroomTrainning.Extension.prototype.createSimpleToolbar = function(){
    // Button 1
    var button1 = new Autodesk.Viewing.UI.Button('my-view-front-button');
    button1.icon.style.backgroundImage = 'url(../img/frontview.png)';

    button1.onClick = function(e) {
      _viewer.setViewCube('front');
    };
    button1.addClass('my-view-front-button');
    button1.setToolTip('View front');

    // Button 2
    var button2 = new Autodesk.Viewing.UI.Button('my-view-back-button');
    button2.icon.style.backgroundImage = 'url(../img/backview.png)';
    button2.onClick = function(e) {
      _viewer.setViewCube('back');
    };
    button2.addClass('my-view-back-button');
    button2.setToolTip('View Back');

    // SubToolbar
    this.subToolbar = new Autodesk.Viewing.UI.ControlGroup('my-custom-view-toolbar');
    this.subToolbar.addControl(button1);
    this.subToolbar.addControl(button2);

    _viewer.toolbar.addControl(this.subToolbar);
    
};

Viewing.ClassroomTrainning.Extension.prototype.createDivToolbar = function(){
    

    var createToggleButton = function(){
        
        var geoMaterial = null;
        
        var initMaterial = function(){
            if( geoMaterial == null ){
                geoMaterial = new THREE.MeshPhongMaterial({color: 0xff0000, specular: 0x009900, shininess: 30, 
                                                         shading: THREE.FlatShading });
                _viewer.impl.matman().addMaterial( 'material-red', geoMaterial, true );
                console.log('Red material is added');                
            }
        };
        
        var uninitMaterial = function(){
            if( geoMaterial ){
                _viewer.impl.matman().removeMaterial('material-red');
                geoMaterial = null;          
                console.log('Red material is removed');                
            };
            
        };

        var createGeometry = function(event){
            var screenPoint = {
                x: event.clientX, 
                y: event.clientY
            };
            
            var worldPoint = _self.screenPointToHitPoint(screenPoint);
            if( worldPoint ){
                console.log('find a point by click.'+ worldPoint);
                // create a sphere    
                var sphere = new THREE.SphereGeometry( 1, 32 );
                var mesh = new THREE.Mesh(sphere, geoMaterial);
                mesh.position.set(worldPoint.x, worldPoint.y, worldPoint.z);
                _viewer.impl.scene.add(mesh);
                console.log('created a mesh and added to the scene.' + mesh.name);
                _viewer.impl.sceneUpdated(true);
            }
            else
                console.log('can not find a point by click');
        };

        var toggleButtonOn = function(){
            initMaterial();
            $('#viewer').bind('click', createGeometry );

        };

        var toggleButtonOff = function(){
            uninitMaterial();
            $('#viewer').unbind('click', createGeometry );
        };


        var toggleButton = new Autodesk.Viewing.UI.Button('my-toggle-button');
        toggleButton.icon.style.backgroundImage = 'url(../img/button.png)';
        toggleButton.setToolTip('Create a sphere');
        toggleButton.addClass('my-toggle-button');
        toggleButton.onClick = _self.createToggler(toggleButton, toggleButtonOn, toggleButtonOff );
 
        return toggleButton;
        
    };

    // Add a seperated button
    var toolbarDivHtml = "<div id='divToolbar'></div>";
    $(_viewer.container).append(toolbarDivHtml);
    
    $('#divToolbar').css({
      'top': '20%',
      'left': '20%',
      'z-index': '100',
      'position': 'absolute'
    });    
    
    var ctrGroup = new Autodesk.Viewing.UI.ControlGroup('my-seperated-toolbar');
    var button3  = new Autodesk.Viewing.UI.Button('my-seperated-button');
    button3.icon.style.backgroundImage = 'url(../img/button.png)';
    button3.setToolTip('I am a seperated button');
    button3.addClass('my-seperated-button');
    button3.onClick = function(){
        console.log('I am a div button');
        alert('I am a div button');
    };
    
    
    ctrGroup.addControl(button3);
    var toggleButton = createToggleButton();
    ctrGroup.addControl(toggleButton);
    
    $('#divToolbar')[0].appendChild(ctrGroup.container);
};


Viewing.ClassroomTrainning.Extension.prototype.createMyUI = function(){
    console.log('create UI');
    _self.createSimpleToolbar();
    _self.createDivToolbar();
};


Viewing.ClassroomTrainning.Extension.prototype.load  = ()=>{
    if( _viewer.toolbar){
        _self.createMyUI();
    }else{
        _viewer.addEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, _self.onToolbarCreated );
        console.log('Events are registered');
    }

    console.log('My extension is loaded');
    return true;
};



Viewing.ClassroomTrainning.Extension.prototype.unload  = ()=>{
    console.log('My extension is unloaded');
    _viewer.toolbar.removeControl(_self.subToolbar);
    return true;
    
};


Autodesk.Viewing.theExtensionManager.registerExtension(
    'MyExtension', Viewing.ClassroomTrainning.Extension);

