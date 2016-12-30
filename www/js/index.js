/*

The MIT License (MIT)

Copyright (c) Thu Aug 18 2016 Zhong Wu zhong.wu@autodesk.com

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORTOR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

$(document).ready(function () {
  var getToken = () => {
    var xhr = new XMLHttpRequest()

    xhr.open('GET', '/api/token', false)
    xhr.send(null)
    var response = JSON.parse(xhr.responseText)
    return response.access_token
  }

  var getBuckets = function () {
    var xhr = new XMLHttpRequest()
    xhr.open('GET', '/api/buckets', false)
    xhr.send(null)
    var response = JSON.parse(xhr.responseText)
    return response
  }

  var getModels = () => {
    var xhr = new XMLHttpRequest()
    xhr.open('GET', '/api/models', false)
    xhr.send(null)
    var response = JSON.parse(xhr.responseText)
    return response
  }

  // load the models into the panel
  function loadModelList () {
    var list = document.querySelector('.control-panel .table-list')
    for (var i = 0; i < viewModels.length; i++) {
      // create table cell for model
      var cell = document.createElement('div')
      cell.className = 'table-cell'
      var modelId = 'model' + i
      cell.id = 'model' + i

      // create collapse button for each model cell
      var cellBtn = document.createElement('div')
      cellBtn.className = 'cell-btn icon icon-angle-right'

      // create label for each model cell
      var cellLabel = document.createElement('div')
      cellLabel.className = 'cell-label'
      cellLabel.innerHTML = viewModels[i].label

      cell.appendChild(cellBtn)
      cell.appendChild(cellLabel)

      // create sublist for viewstate screenshots
      var sublist = document.createElement('div')
      sublist.className = 'table-sublist'

      list.appendChild(cell)
      list.appendChild(sublist)
    }
  }

  // init the left control panel
  function initializeControlPanel () {
    // attach mouse events to table cell buttons and labels
    var cellBtns = document.querySelectorAll('.table-list .table-cell .cell-btn')
    for (var i = 0; i < cellBtns.length; i++) {
      var cellBtn = cellBtns[i]
      cellBtn.addEventListener('click', function () {
        var cellId = this.parentElement.id
        var modelIndex = parseInt(cellId.substring(cellId.length - 1, cellId.length))
      // toggleTableList(modelIndex)
      })
      var cellLabel = cellBtn.nextElementSibling
      cellLabel.addEventListener('dblclick', function () {
        var cellId = this.parentElement.id
        var modelIndex = parseInt(cellId.substring(cellId.length - 1, cellId.length))
        // add a new model

        Autodesk.Viewing.Document.load('urn:' + viewModels[modelIndex].urn, onDocumentLoadSuccess, onDocumentLoadFailure)

      // switch to a different model
      // if (modelIndex !== currentModel) {
      //     currentModel = modelIndex
      //     viewerApp.loadDocument("urn:" + viewModels[currentModel].urn, onDocumentLoadSuccess, onDocumentLoadFailure)     // reload viewable document
      // }
      })
    }
  }

  var viewModels
  var viewerApp
  var viewer3D
  var currentModelIndex = 0
  var currentModel
  var currentNodeIds = []

  var options = {
    env: 'AutodeskProduction',
    'getAccessToken': getToken,
    'refreshToken': getToken
  }

  var config3d = {
    extensions: ['MyExtension']
  }

  viewModels = getModels()
  loadModelList()
  initializeControlPanel()

  function onSelectionChanged (event) {
    if (event.selections && event.selections.length) {
      currentNodeIds = event.selections[0].dbIdArray
      currentModel = event.selections[0].model
      viewer3D.currentModel = currentModel

      currentModel.getObjectTree(function (instance) {
        viewer3D.modelstructure.setModel(instance, 'Test Modle')
      })
    }
  }

  function onGeometryLoaded (event) {
  }

  var isolating = false
  function onIsolate (event) {
    if (isolating)
      return

    isolating = true
    var nodes = event.nodeIdArray
    if (nodes) {
      // show all
      var models = viewer3D.impl.modelQueue().getModels()

      if (nodes.length === 0) {
        models.forEach(function (model) {
          model.setAllVisibility(true)
        })
      }else {
        currentModel = event.model
        models.forEach(function (model) {
          model.setAllVisibility(false)
          if (currentModel === model) {
            model.visibilityManager.setVisibilityOnNode(nodes, true)
          }
        })
      }
      isolating = false
    }
  }

  function onHide (event) {
    var nodes = event.nodeIdArray
    currentModel.visibilityManager.setVisibilityOnNode(nodes[0], false)
  }

  Autodesk.Viewing.Initializer(options, function onInitialized () {
    var viewerContainer = document.getElementById('viewer3D')
    viewer3D = new Autodesk.Viewing.Private.GuiViewer3D(viewerContainer, {})
    viewer3D.start()

    if (viewModels.length === 0)
      return

    Autodesk.Viewing.Document.load('urn:' + viewModels[1].urn, onDocumentLoadSuccess, onDocumentLoadFailure)

    if (!viewer3D.hasEventListener(av.AGGREGATE_SELECTION_CHANGED_EVENT, onSelectionChanged))
      viewer3D.addEventListener(Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT, onSelectionChanged)

    if (!viewer3D.hasEventListener(av.GEOMETRY_LOADED_EVENT, onGeometryLoaded))
      viewer3D.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, onGeometryLoaded)

    if (!viewer3D.hasEventListener(av.ISOLATE_EVENT, onIsolate))
      viewer3D.addEventListener(Autodesk.Viewing.ISOLATE_EVENT, onIsolate)

    if (!viewer3D.hasEventListener(av.HIDE_EVENT, onHide))
      viewer3D.addEventListener(Autodesk.Viewing.HIDE_EVENT, onHide)
  })

  function onDocumentLoadSuccess (document) {
    var geometryItems3D = Autodesk.Viewing.Document.getSubItemsWithProperties(document.getRootItem(), {
      'type': 'geometry',
      'role': '3d'
    }, true)

    var modelOptions = {
      sharedPropertyDbPath: document.getPropertyDbPath()
    }

    viewer3D.loadModel(document.getViewablePath(geometryItems3D[0]), modelOptions, onItemLoadSuccess, onItemLoadFail)
  }

  function onDocumentLoadFailure (viewerErrorCode) {
    console.error('onDocumentLoadFailure() - errorCode:' + viewerErrorCode)
  }
  function onItemLoadSuccess (viewer, item) {
    console.log('onItemLoadSuccess()!')
  }
  function onItemLoadFail (errorCode) {
    console.error('onItemLoadFail() - errorCode:' + errorCode)
  }
})
