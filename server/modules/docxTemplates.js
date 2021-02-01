var fs= require('fs'), path= require('path');
var server= require("../server"), log= server.log,
    genDOCX=require("./genDOCX");
const lowDB= require('lowdb'), FileSync= require('lowdb/adapters/FileSync');
const adapter= new FileSync(path.join(__dirname,'/../../history/','history.db')),
    historyDB= lowDB(adapter);

module.exports.validateModule = function(errs, nextValidateModuleCallback){ nextValidateModuleCallback(); };

historyDB.defaults({ templates: [] }).write();// Set some defaults

var docxTemplatesByUID={};
var getTemplateLastItemsByDate= function(tUID, count){
    //console.log("last=",historyDB.get('templates').findLast(function(item){return item.id=tID}).value());//IT'S FOR TEST
    //console.log("filter=",historyDB.get('templates').filter(function(item){return item.id=tID}).sortBy('datetime').takeRight(100).value());//IT'S FOR TEST
    //console.log("getTemplateLastItemsByDate map=",historyDB.get('templates').filter(function(item){return item.id=tID}).orderBy('datetime','desc').take(count).map('data').value());//IT'S FOR TEST
    var tName= docxTemplatesByUID[tUID].name;
    var resultSet=
        historyDB.get('templates').filter(function(item){return item.name==tName}).orderBy('datetime','desc').take(count);
    return resultSet.map(function(item){ item.data['datetime']=item.datetime; return item.data }).value();
};
module.exports.setUserMenuDocxTemplatesFromAppConfig= function(menuBar,appConfigDocxTemplates){
    if(!appConfigDocxTemplates||!menuBar||!docxTemplatesByUID) return;
    var menuBarItemDocDocxTemplates=null;
    for(var menuItem of menuBar){
        if(!menuItem||menuItem.module!="docxTemplates") continue;
        menuBarItemDocDocxTemplates= menuItem;
        break;
    }
    if(!menuBarItemDocDocxTemplates) return;
    var docxTemplatesPopupMenu=[];
    for(var tUID in docxTemplatesByUID){
        var t= docxTemplatesByUID[tUID], menuBarItem={menuItemName:menuBarItemDocDocxTemplates.menuItemName+"_"+tUID};
        if(t){
            menuBarItem.menuTitle= t["title"];
            menuBarItem.pageId= "page_"+tUID;
            menuBarItem.pageTitle= t["title"];
            menuBarItem.action= "open";
            menuBarItem.contentHref = "/docxTemplates/"+tUID;
            menuBarItem.closable=true;
        }
        docxTemplatesPopupMenu.push(menuBarItem);
    }
    menuBarItemDocDocxTemplates.popupMenu= docxTemplatesPopupMenu;
};

module.exports.init= function(app){
    var appConfigDocxTemplates= server.getAppConfigDocxTemplates();
    if(!appConfigDocxTemplates) throw new Error('NO appConfigDocxTemplates!');
    if(!appConfigDocxTemplates.templates) throw new Error('NO appConfigDocxTemplates templates!');
    var tmplNum=0;
    for(var tmplItemName in appConfigDocxTemplates.templates){
        tmplNum++;
        var tmplItemData= appConfigDocxTemplates.templates[tmplItemName];
        if(!tmplItemData) continue;
        tmplItemData.name= tmplItemName;
        var tmplUID= tmplItemData["uid"];
        if(tmplUID==null){
            tmplUID= "doxTemplateUID_"+tmplNum.toString();
            tmplItemData["uid"]= tmplUID;
        }
        docxTemplatesByUID[tmplUID]= tmplItemData;
    }
    var checkTemplateDataOutputPath= function(sTemplateOutputPath){
        if(!sTemplateOutputPath) return true;
        var iOutputPathPosA=0, iOutputPathPosB=0, sTemplateOutputPathItem;
        while(iOutputPathPosB<sTemplateOutputPath.length){
            iOutputPathPosB= sTemplateOutputPath.indexOf("/",iOutputPathPosA+1);
            if(iOutputPathPosB<0) iOutputPathPosB= sTemplateOutputPath.indexOf("\\",iOutputPathPosA+1);
            if(iOutputPathPosB<0) iOutputPathPosB= sTemplateOutputPath.length;
            sTemplateOutputPathItem= sTemplateOutputPath.substring(0,iOutputPathPosB);
            try {
                if(!fs.existsSync(sTemplateOutputPathItem)){ fs.mkdirSync(sTemplateOutputPathItem); }
            }catch(e){                                                                                          log.error("FAILED create directory for template outputPath! Reason:",e.message);
                return false;
            }
            iOutputPathPosA=iOutputPathPosB+1;
        }
        return true;
    };
    var checkAllTemplatesOutputPath= function(appConfigDocxTemplatesData){
        if(!appConfigDocxTemplatesData) return true;
        for(var tmplDataName in appConfigDocxTemplatesData){
            var tmplData= appConfigDocxTemplatesData[tmplDataName];
            if(!tmplData) continue;
            if(!checkTemplateDataOutputPath(tmplData.outputPath)) return false;
        }
    };
    checkAllTemplatesOutputPath(appConfigDocxTemplates.templates);

    app.get("/docxTemplates/*",function(req,res){
        if(!req.params){ res.send({error:"UNKNOWN URI!"}); return; }
        var urlParams= req.params[0].split('/'), tUID= urlParams[0], action= urlParams[1];                      //console.log("urlParams",urlParams);
        if(!tUID){ res.send({error:"UNKNOWN URI!"}); return; }
        if(!action){
            var tmplItemData= docxTemplatesByUID[tUID];
            if(!tmplItemData){ res.send({error:{message:"NO finded template data by template UID!",userMessage:"Нет заданы параметры для шаблона!"}}); return; }
            fs.readFile(appViewsPath+"docxTemplates.html",'utf8',function(err,tPage){
                if(err){ res.send({error:"Failed get template page! Reason:"+err.message}); return; }
                res.send(tPage.replace(/docxTemplates_/g,tUID));
            });
            return;
        }
        if(action=="getTemplateData"){
            var tmplData= docxTemplatesByUID[tUID], tFields;
            if(!tmplData){ res.send({error:{message:"NO finded template data by template UID!",userMessage:"Нет заданы параметры для шаблона!"}}); return; }
            tFields= tmplData.fields;
            if(!tFields){ res.send({error:{message:"Template data no fields!",userMessage:"Для шаблона не заданы поля параметров!"}}); return; }
            var tFieldsParams={};
            for(var tfID in tFields) tFieldsParams[tfID]=tFields[tfID];
            res.send({fields:tFieldsParams,files:tmplData.files});
            return;
        }else if(action=="getTemplateParamsHistory"){
            var tmplData= docxTemplatesByUID[tUID], tFields;
            if(!tmplData){ res.send({error:{message:"NO finded template data by template ID!",userMessage:"Нет заданы параметры для шаблона!"}}); return; }
            tFields= tmplData.fields;
            if(!tFields){ res.send({error:{message:"Template data no fields!",userMessage:"Для шаблона не заданы поля параметров!"}}); return; }
            var tTableParamsHistory=[
                {data:"datetime", name:"Дата", width:100, type:"text",datetimeFormat:"DD.MM.YY HH:mm:ss",align:"center", useFilter:false }
            ];
            for(var tfID in tFields) tTableParamsHistory.push({data:tfID, name:tfID, width:250, type:"text"});
            res.send({columns:tTableParamsHistory,identifier:tTableParamsHistory[0].data,items:getTemplateLastItemsByDate(tUID,100)});
            return;
        }
        res.send({error:"UNKNOWN URI action!"});
    });
    app.post("/docxTemplates/*",function(req,res){
        if(!req.params){ res.send({error:"UNKNOWN URI!"}); return; }
        var urlParams= req.params[0].split('/'), tUID= urlParams[0], action= urlParams[1];
        if(!tUID){ res.send({error:"UNKNOWN URI!"}); return; }
        if(!action){ res.send({error:"NO URI action!"}); return; }
        if(action=="sendDataAndGenDocx"){
            var tmplData= docxTemplatesByUID[tUID], tFields;
            if(!tmplData){ res.send({error:{message:"NO finded template data by template UID!",userMessage:"В конфигурации не заданы параметры для шаблона!"}}); return; }
            if(!tmplData.directory){ res.send({error:{message:"NO path with templates!",userMessage:"В конфигурации не указан путь расположения шаблонов!"}}); return; }
            if(!tmplData.outputPath){ res.send({error:{message:"NO path for store template docx!",userMessage:"В конфигурации не указан путь для сохранения результата!"}}); return; }
            if(!req.body||!req.body.values){
                res.send({error:{message:"NO data values for generate template docx!",userMessage:"Для заполнения шаблона нет значений!"}});
                return;
            }
            try{
                var values= JSON.parse(req.body.values);
            }catch(e){
                res.send({error:{message:"Data values not valid for generate template docx!",userMessage:"Для заполнения шаблона указанные значения недопустимы!"}});
                return;
            }
            if(!req.body.files){
                res.send({error:{message:"NO files for generate template docx!",userMessage:"Не указаны файлы шаблонов для генерации!"}});
                return;
            }                                                                                                   log.debug("docxTemplates sendDataAndGenDocx values=",values,"\nfiles=",req.body.files,{});
            var storeHistoryResult= null;
            try{
                if(storeHistory(tUID,values)) storeHistoryResult="История значений сохранена (сохраненные параметры).";
            }catch(e){
                storeHistoryResult+= "Не удалось сохранить значения в истории значений (сохраненные параметры)! Причина: "+e.message;
            }
            var files= req.body.files;
            if(typeof(files)=="string") files=[files];
            var ramdomizeFileds= tmplData.ramdomizeFileds, ramdomizer= appConfigDocxTemplates["ramdomizer"];
            if(ramdomizeFileds&&ramdomizer){
                var randomFont= Math.floor(Math.random()*ramdomizer.fonts.length),
                    randomFSize= Math.floor(Math.random()*ramdomizer.sizes.length);
                for(var rfKey in ramdomizeFileds){
                    var vKey= ramdomizeFileds[rfKey];
                    if(vKey===undefined||vKey===null)continue;
                    var val= values[vKey];
                    if(val===undefined)continue;
                    var newVal= {text:val}; values[vKey+"@"]= newVal;
                    if(ramdomizer.fonts) newVal.fontName= ramdomizer.fonts[randomFont];
                    if(ramdomizer.sizes) newVal.fontSize= ramdomizer.sizes[randomFSize];
                }
            }
            if(!checkTemplateDataOutputPath(tmplData.outputPath)){
                res.send({error:{message:"Failed create output files by template outputPath!",userMessage:"Не удалось создать файлы документов по шаблонам! Причина: некорректный путь для создания файлов в настройках шаблонов."},
                    storeHistoryResult:storeHistoryResult});
                return;
            }
            genDOCX.generateDOCX(0,{values:values,files:files,directory:tmplData.directory,outputPath:tmplData.outputPath},
                function(result){
                    if(!result) result= {generateResult:true,userMsg:"Все документы по шаблонам успешно созданы!",storeHistoryResult:storeHistoryResult};
                    res.send(result);
                });
            return;
        }
        res.send({error:"UNKNOWN URI action!"});
    });
};

function storeHistory(tUID,data){
    var lastItems= getTemplateLastItemsByDate(tUID,1), lastItem;
    if(lastItems)lastItem= lastItems[0];
    if(lastItem){
        var equals=true;
        for(var tfID in data) if(data[tfID]!=lastItem[tfID]){ equals=false; break; }
        if(equals) return false;
    }
    var tName= docxTemplatesByUID[tUID].name;
    historyDB.get('templates').push({name:tName,datetime:new Date(),data:data}).value();
    historyDB.write(); historyDB.read();
    return true;
}