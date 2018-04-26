//1.0.5
const fs = require('fs');
const request = require('request');
const parseString = require('xml2js').parseString;

function base64_encode(file) {
    let bitmap = fs.readFileSync(file);
    return new Buffer(bitmap).toString('base64');
}

function doLoginPromise() {
    return new Promise(function (resolve, reject) {
        
        let creds = JSON.parse(new Buffer(fs.readFileSync('credentials.json')).toString());        

        var options = {
            url: creds.url,
            headers: {
                "Content-Type": 'text/xml',
                'SOAPAction': 'Wololo'
            },
            body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:partner.soap.sforce.com"><soapenv:Body><urn:login><urn:username>${creds.username}</urn:username><urn:password>${creds.password}</urn:password></urn:login></soapenv:Body></soapenv:Envelope>`
        };
                        
        request.post(options, function(error, response, body) {
            if ( error){
                reject(Error(error));
            }
            else{                
                if ( response.statusCode == 200 ){                    
                    let obj = getTokensFromXml(body);                    
                    fs.writeFile('oauth.lck', JSON.stringify(obj), function(e){
                        if (e){
                            console.log('ERROR WRITING oauth.lck');
                        }
                    });                                     
                    resolve(body);
                }else{
                    reject(Error("NO200"));
                }
            }            
        });
        
    });
}

function doCreateStaticResource(name, sfdcUrl, token) {
    return new Promise(function (resolve, reject) {
        console.log('dist/'+name);        
        var options = {
                url: sfdcUrl+'/services/data/v41.0/tooling/sobjects/StaticResource',
                headers: {
                        "Authorization": "Bearer "+token,
                        "Content-Type": "application/json"
                    },            
                body: JSON.stringify({
                    "ContentType": "text/javascript",
                    "Name": name,
                    "Body": base64_encode('dist/'+name+'.js')
                })
            };
                            
            request.post(options, function(error, response, body) {
                if ( error){
                    reject(Error(error));
                }
                else{                                    
                    if ( response.statusCode == 201 ){
                        const dat = JSON.parse(body);                        
                        resolve("OK");
                    }else{
                        console.log(response.statusCode);                        
                        reject(Error("GENERIC"));
                    }
                }            
            });
    });
}

function doUpdateStaticResource(id, name, sfdcUrl, token) {
    return new Promise(function (resolve, reject) {        
        var options = {
                url: sfdcUrl+'/services/data/v41.0/tooling/sobjects/StaticResource/'+id,
                headers: {
                        "Authorization": "Bearer "+token,
                        "Content-Type": "application/json"
                    },            
                body: JSON.stringify({
                    "ContentType": "text/javascript",
                    "Name": name,
                    "Body": base64_encode('dist/'+name+'.js')
                })
            };
                            
            request.patch(options, function(error, response, body) {
                if ( error){
                    reject(Error(error));
                }
                else{                      
                    if ( response.statusCode == 204 ){                        
                        resolve("OK");
                    }else{
                        console.log(response.statusCode);
                        reject(Error("GENERIC"));
                    }
                }            
            });
    });
}

function doQuery(sfdcUrl, token) {
    return new Promise(function (resolve, reject) {
        var options = {
                url: sfdcUrl+'/services/data/v41.0/tooling/query/?q=SELECT+id,name+FROM+StaticResource+where+contenttype=%27text/javascript%27',
                headers: {
                        "Authorization": "Bearer "+token,
                        "Content-Type": "application/json"
                    }
            };
                            
            request.get(options, function(error, response, body) {
                if ( error){
                    reject(Error(error));
                }
                else{                      
                    if ( response.statusCode == 200 ){
                        const dat = JSON.parse(body);
                        resolve(dat);
                    }else{
                        console.log(response.statusCode);
                        reject(Error("doQuery GENERIC"));
                    }
                }            
            });
    });
}

function existeResource(name, data){
    const x = data.records;    
    for (let i in x){
        if (x[i].Name === name){
            return x[i];
        }
    }
    return null;
}

function uploadStaticResources(t){
    if ( t < 2 ){
        doQuery(sfdcUrl, token)
            .then(function(datos){
                for (let i in names){   
                    let resource = existeResource(names[i], datos);
                    if ( resource ){
                        doUpdateStaticResource(resource.Id, names[i], sfdcUrl, token).then(function(d){
                            console.log(names[i]+" UPDATED "+d);
                        }).catch(function(e){                            
                            console.log("ERROR: doUpdateStaticResource");                            
                        });
                    }
                    else{
                        doCreateStaticResource(names[i], sfdcUrl, token).then(function(d){
                            console.log(names[i]+" CREATED "+d);
                        }).catch(function(e){
                            console.log("ERROR: doCreateStaticResource");                            
                        });
                    }
                }
            })
            .catch(function(e){
                console.log("ERROR: "+e);                
                doLoginPromise().then(function(d){
                    t2 = t+1;
                    let obj = getTokensFromXml(d);
                    token = obj.access_token;
                    sfdcUrl = obj.instance_url;
                    uploadStaticResources(t2);
                });
            });
    }
}

function getTokensFromXml(data){      
    let ret;    
    parseString(data, function (err, result) {
        let url = result['soapenv:Envelope']['soapenv:Body'][0].loginResponse[0].result[0].serverUrl[0];
        let i = url.lastIndexOf('/services');   
        ret = {
            "access_token": result['soapenv:Envelope']['soapenv:Body'][0].loginResponse[0].result[0].sessionId[0],
            "instance_url": url.substr(0, i)
        }                    
    });
    return ret;
}

let names = [];
let token = "";
let sfdcUrl = "";

process.argv.forEach(function (val, index, array) {
    if ( index >= 2 ){
        names.push(val.substr(0,val.lastIndexOf(".")));
    }    
});

try{
    const outa = fs.readFileSync('oauth.lck');
    const out2 = new Buffer(outa).toString();
    token=JSON.parse(out2).access_token;
    sfdcUrl=JSON.parse(out2).instance_url;
}catch(e){
    token = "";
    sfdcUrl="";
}

uploadStaticResources(0);
