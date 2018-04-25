var fs = require('fs');

console.log('CREATE SERVICE');
console.log('\nInsert the name of the service: ');

var readline = require('readline');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});



rl.on('line', function(line){    
    // fs.createReadStream('node_modules/lightning-typescript-tools/service.tmpl').pipe(fs.createWriteStream(`src/${line}.ts`));

    let template = `import { $A, AuraAction, AuraDescription, AuraResponse, AuraComponent, window, CommonFunctions, ICommomFunctions } from './auraTypes';

//Declare local types. Very good practice to avoid type error
/*
interface Example{
    Id: string;
    Name: string;
}
*/

window.${line} = function(cmp: AuraComponent){
    //LOCAL FUNCTIONS AND ATTRIBUTES HERE    
    let commomFunctions: ICommomFunctions = CommonFunctions(cmp);
    
    //API PUBLIC METHODS HERE
    return{        
        /*
        sampleMethod: function(){            
            commomFunctions.executeActionPromise('c.auramethod', {params: Object})                
                .then($A.getCallback(function(result: AuraResponse){
                    //Declare a typed variable for the return Value
                    let r: Example = result.getReturnValue();                    
                }))
                .catch($A.getCallback(function(error: Error){
                    $A.reportError("error message here", error);
                })
            );
        }
        */
    };
}
`;

    fs.writeFile(`src/${line}.ts`, template, function(e){
        if (e){
            console.log(`ERROR WRITING ${line}.ts`);
        }
    }); 

    console.log(`${line}.ts created successfully`);
    setTimeout(function(){
        process.exit();
    }, 500);
    
})