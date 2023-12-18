let map, datasource, client;
/*let endLocation = document.getElementById('end-location');
let startLocation = document.getElementById('start-location');*/

function GetMap() {
    //Add Map Control JavaScript code here.
    //Instantiate a map object
    var map = new atlas.Map('myMap', {
        // Replace <Your Azure Maps Key> with your Azure Maps subscription key. https://aka.ms/am-primaryKey
        authOptions: {
        authType: 'subscriptionKey',
        subscriptionKey: 'fP02nrn1wVTxw9p-oHVMhAnA9A7UtOOpuwWl1YfyTLk'
        }
    });

    //Wait until the map resources are ready.
    map.events.add('ready', function() {

    //Create a data source and add it to the map.
    datasource = new atlas.source.DataSource();
    map.sources.add(datasource);

    //Add a layer for rendering the route lines and have it render under the map labels.
    map.layers.add(new atlas.layer.LineLayer(datasource, null, {
        strokeColor: '#b31926',
        strokeWidth: 5,
        lineJoin: 'round',
        lineCap: 'round'
    }), 'labels');

    //Add a layer for rendering point data.
    map.layers.add(new atlas.layer.SymbolLayer(datasource, null, {
        iconOptions: {
            image: ['get', 'icon'],
            allowOverlap: true
    },
        textOptions: {
            textField: ['get', 'title'],
            offset: [0, 1.2]
        },
        filter: ['any', ['==', ['geometry-type'], 'Point'], ['==', ['geometry-type'], 'MultiPoint']] //Only render Point or MultiPoints in this layer.
    }));

    //Create the GeoJSON objects which represent the start and end points of the route.
    //starting coordinates
    let start_lat=parseFloat(startLocation.value.split(':')[1].split(',')[0])
    let start_long=parseFloat(startLocation.value.split(':')[1].split(',')[1])
    
    var startPoint = new atlas.data.Feature(new atlas.data.Point([start_long,start_lat]), {
        title: `${startLocation.value.split(':')[0]}`,
        icon: "pin-red"
    });

    //destination coordinates
    let end_lat=parseFloat(endLocation.value.split(':')[1].split(',')[0])
    let end_long=parseFloat(endLocation.value.split(':')[1].split(',')[1])
    var endPoint = new atlas.data.Feature(new atlas.data.Point([end_long,end_lat]), {
        title: `${endLocation.value.split(':')[0]}`,
        icon: "pin-round-red"
    });

    //Add the data to the data source.
    datasource.add([startPoint, endPoint]);

    map.setCamera({
        bounds: atlas.data.BoundingBox.fromData([startPoint, endPoint]),
        padding: 90
    });

    //Use MapControlCredential to share authentication between a map control and the service module.
    var pipeline = atlas.service.MapsURL.newPipeline(new atlas.service.MapControlCredential(map));

    //Construct the RouteURL object
    var routeURL = new atlas.service.RouteURL(pipeline);

    //Start and end point input to the routeURL
    var coordinates= [[startPoint.geometry.coordinates[0], startPoint.geometry.coordinates[1]], [endPoint.geometry.coordinates[0], endPoint.geometry.coordinates[1]]];

    //Make a search route request
    routeURL.calculateRouteDirections(atlas.service.Aborter.timeout(10000), coordinates).then((directions) => {
        //Get data features from response
        var data = directions.geojson.getFeatures();
        datasource.add(data);
    });

    });

    //create time formatter
    // Create a formatter with options for 12-hour clock system
    const formatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
    });
    //route calculation result container & pricing container
    const res_routBox=document.getElementById('res-container')
    const pricing_container = document.getElementById('ad-label-box')

    //get route calculation details
    fetch(`https://atlas.microsoft.com/route/directions/json?subscription-key=fP02nrn1wVTxw9p-oHVMhAnA9A7UtOOpuwWl1YfyTLk&api-version=1.0&query=${startLocation.value.split(':')[1]}:${endLocation.value.split(':')[1]}`)
    .then(response => response.json())
    .then(route =>{

        if((parseFloat(route.routes[0].summary.travelTimeInSeconds)/60).toFixed(0)>=60){
            route.routes[0].summary.travelTimeInSeconds = `${(parseFloat(route.routes[0].summary.travelTimeInSeconds)/3600).toFixed(0)} Hrs`
        }else{
            route.routes[0].summary.travelTimeInSeconds = `${parseFloat((route.routes[0].summary.travelTimeInSeconds)/60).toFixed(0)} mins`
        }

        if((parseFloat(route.routes[0].summary.trafficDelayInSeconds)/60).toFixed(0)>=60){
            route.routes[0].summary.trafficDelayInSeconds = `${(parseFloat(route.routes[0].summary.trafficDelayInSeconds)/3600).toFixed(0)} Hrs`
        }else{
            route.routes[0].summary.trafficDelayInSeconds = `${parseFloat((route.routes[0].summary.trafficDelayInSeconds)/60).toFixed(0)} mins`
        }

        res_routBox.innerHTML=
        `
        <div class="result-card">
            <h1>${(parseFloat(route.routes[0].summary.lengthInMeters)/1000).toFixed(0)}Km</h1>
            <p><i class="fa fa-car"></i></p>
        </div>

        <div class="result-card">
            <h1>Hailed at</h1>
            <p><i class="fa fa-person-circle-plus"></i> ${formatter.format(new Date(route.routes[0].summary.departureTime))}</p>
        </div>

        <div class="result-card">
            <h1>Drop off time</h1>
            <p><i class="fa fa-person-walking"></i> ${formatter.format(new Date(route.routes[0].summary.arrivalTime))}</p>
        </div>

        <div class="result-card">
            <h1>Duration</h1>
            <p><i class="fa fa-stopwatch"></i> ${ route.routes[0].summary.travelTimeInSeconds}</p>
        </div>

        <div class="result-card">
            <h1>Traffic time</h1>
            <p><i class="fa-regular fa-clock"></i> ${(parseFloat(route.routes[0].summary.trafficDelayInSeconds)/60).toFixed(0)}min</p>
        </div>
        `
        // $0.1885/km, & $0.028/min - theses are my pricing table value

        pricing_container.innerHTML = `<p> <i class="fa fa-wallet"></i> Trip cost <i class="fa fa-arrow-right"></i> $ ${(((parseFloat(route.routes[0].summary.lengthInMeters)/1000)*0.1885)+((parseFloat(parseInt(route.routes[0].summary.trafficDelayInSeconds)/60))*0.028)).toFixed(2)}</p>`
    })

    
}