var myHeaders = new Headers();
myHeaders.append("Authorization", "Bearer " + process.env.UNIFIED_API_KEY);
myHeaders.append("Content-Type", "application/json");

var raw = JSON.stringify({});

var requestOptions: RequestInit = {
   method: 'GET',
   headers: myHeaders,
   body: raw,
   redirect: 'follow'
};

fetch("https://www.yunqiaoai.top/v1/models", requestOptions)
   .then(response => response.text())
   .then(result => console.log(result))
   .catch(error => console.log('error', error));

var requestOptions: RequestInit = {
   method: 'GET',
   headers: myHeaders,
   redirect: 'follow'
};

fetch("http://api.example.com/api/usage/token", requestOptions)
   .then(response => response.text())
   .then(result => console.log(result))
   .catch(error => console.log('error', error));

var raw = JSON.stringify({
   "model": "gpt-4.1-mini",
   "messages": [
      {
         "role": "system",
         "content": "You are a helpful assistant."
      },
      {
         "role": "user",
         "content": "你好"
      }
   ]
});

var requestOptions: RequestInit = {
   method: 'POST',
   headers: myHeaders,
   body: raw,
   redirect: 'follow'
};

fetch("http://api.example.com/v1/chat/completions", requestOptions)
   .then(response => response.text())
   .then(result => console.log(result))
   .catch(error => console.log('error', error));