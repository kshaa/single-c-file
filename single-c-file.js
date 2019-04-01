/*
Copyright (c) 2014 Adrian Dawid

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
var path = require('path');
var fs = require('fs');
var newFile = [];
var headers = [];
var dontImportHeaders = false;
var defines = [];

function addFile(fileContent, parentFileName = null)
{
  var parentPath = parentFileName ? path.dirname(parentFileName) : null;
  var readerActive = true;
  var lockedNdefValue = null;
  newFile.push("");
  newFile.push("// Begining of include '" + parentFileName + "'");
  for(lineNr in fileContent)
  {
    if(fileContent[lineNr])
    {
      if (lockedNdefValue !== null) {
          if (fileContent[lineNr].substring(0,2) != "//"  && fileContent[lineNr].substring(0,6) == "#endif") {
            lockedNdefValue = null;
          }

          break;
      }
      if (fileContent[lineNr].substring(0,2) != "//"  && fileContent[lineNr].substring(0,6) == "#endif") {
        continue;
      }
      if(fileContent[lineNr].substring(0,2) != "//"  && fileContent[lineNr].substring(0,7) == "#ifndef")
      {
        var ndefineValue = fileContent[lineNr].replace("#ifndef ","");
        if (defines.includes(ndefineValue)) {
            lockedNdefValue = ndefineValue;
        }
        continue;
      }
      if(fileContent[lineNr].substring(0,2) != "//"  && fileContent[lineNr].substring(0,7) == "#define")
      {
        var defineValue = fileContent[lineNr].replace("#define ","");
        defines.push(defineValue);
        continue;
      }
      if(fileContent[lineNr].substring(0,2) != "//"  && fileContent[lineNr].substring(0,8) != "#include")
      {
        newFile.push(fileContent[lineNr]);
      }
      if(fileContent[lineNr].substring(0,8) == "#include")
      {
        var tmpFileName = fileContent[lineNr].replace("#include","");
        tmpFileName = tmpFileName.replace(" ","");
        tmpFileName = tmpFileName.replace("\"","");
        tmpFileName = tmpFileName.replace("\"","");
        var headerIsNew = true;
        for (index in headers)
        {
            if(headers[index] == tmpFileName)
            {
                headerIsNew = false;
            }
        }
        var absoluteFileName = (parentPath + '/' + tmpFileName).replace("/./","/"); 
        try
        {
          if(headerIsNew && !dontImportHeaders)
          {
            var array = fs.readFileSync(absoluteFileName).toString().split("\n");
            addFile(array, absoluteFileName);                    
          }
          if(dontImportHeaders)
          {
              newFile.push(fileContent[lineNr]);
          }
        }
        catch(err){
          newFile.push(fileContent[lineNr]);
        }
        if(headerIsNew)
        {
              headers.push(tmpFileName);
        }
      }
    }
  }
  newFile.push("// End of include '" + parentFileName + "'");
  newFile.push("");
}

function merge(file,newFileName)
{
  for(lineNr in file)
  {
      if(file[lineNr])
      {
          var array = fs.readFileSync(file[lineNr]).toString().split("\n");
          addFile(array, "./" + newFileName);
      }
  }
  var tmpFile = fs.createWriteStream(newFileName);
  tmpFile.on('error', function(err) {
    console.log("File could not be saved!")
    });
  for(lineNr in newFile)
  {
    tmpFile.write(newFile[lineNr] + "\n");
  }
  tmpFile.end();
}

function main()
{
  var fileName = "none";
  console.log("Single-C-File by Adrian Dawid. \nCopyright 2014 Adrian Dawid. \nThis software is licensed under the MIT-License!");
  fileName = process.argv[2];
  if(process.argv[3])
  {
    if(process.argv[3] == "dontImportHeaders" || process.argv[3] == "-dontImportHeaders")
    {
      dontImportHeaders = true;
    }
  }
  //Was there an argument?
  if(!fileName)
  {
    console.log("You have to specify a file name! \n Use this tool like this: \nnode single-c-file.js <project-defination-filename>");
    //Quits the application.
    return;
  }
  console.log("Using:%s",fileName);
  //Reading the contents of the file
  var mainFile;
  fs.readFile(fileName, function (err, data) {
      if (err)
      {
        console.log("The specefied file could not be opened or does not exist!");
        return;
      }
      var array = data.toString().split("\n");
      var newFileName = process.argv[3];
      if (!newFileName) {
        newFileName = fileName.split(".")[0] + "_merged.cxx";
      }
      merge(array,newFileName);
  });
}

//Start the main function
main();