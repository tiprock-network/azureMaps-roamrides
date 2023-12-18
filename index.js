// Reference to the select element.
let endLocation = document.getElementById('end-location');
let startLocation = document.getElementById('start-location');
let startList = document.getElementById('start-locations-list');
let endList = document.getElementById('end-locations-list');

function getLocations(qLocation,from){
    // Fetch JSON data from the API.
    
    fetch(`https://atlas.microsoft.com/search/address/json?subscription-key=fP02nrn1wVTxw9p-oHVMhAnA9A7UtOOpuwWl1YfyTLk&api-version=1.0&language=en-US&query=${qLocation}`)
    .then(response => response.json())
    .then(data => {
        // Iterate over the JSON data and add options to the select element.
       if(from){
        data.results.forEach(location => {
            startList.innerHTML +=`<option value="${location.address.freeformAddress}:${location.position.lat},${location.position.lon}"></option>`
            
        });
       }else{
        data.results.forEach(location => {
            endList.innerHTML +=`<option value="${location.address.freeformAddress}:${location.position.lat},${location.position.lon}"></option>`
            
        });
       }
       
    })
    .catch(error => {
        console.error('Error fetching JSON data:', error);
    });
}


startLocation.addEventListener('input',(e)=>{
    getLocations(qLocation=e.target.value,from=true)
})

endLocation.addEventListener('input',(e)=>{
    getLocations(qLocation=e.target.value)
})



