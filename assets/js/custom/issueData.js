async function getData(){
  let response = await $.ajax({
    method: 'GET',
    url: 'http://127.0.0.1:8000/',
    contentType: 'application/json'
  }).fail(function(error){
    Utilities.showAlert("Could't get issues data",'danger');
  });
  return response;
}