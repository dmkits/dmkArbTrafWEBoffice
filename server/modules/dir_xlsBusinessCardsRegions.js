var dataModel=require(appDataModelPath);
var systemFuncs= require('../systemFuncs');

module.exports.validateModule = function(errs, nextValidateModuleCallback){ nextValidateModuleCallback(); };

module.exports.modulePageURL= "/dirXlsBusinessCardsRegions";
module.exports.modulePagePath= "dir_xlsBusinessCardsRegions.html";
module.exports.init= function(app){
    var tDirXlsBusinessCardsRegionsTableColumns=[//Область
        {data:"ChID", name:"Код рег.", width:75, type:"text", align:"center", visible:false},
        {data:"Region", name:"Область", width:500, type:"text", align:"center"}
    ];
    var dataStoreDirXlsBusinessCardsRegionsName="dataStoreDirXlsBusinessCardsRegions", dataStoreDirXlsBusinessCardsRegions=[];
    var loadDirXlsBusinessCardsRegions= function(){
        dataStoreDirXlsBusinessCardsRegions= systemFuncs.loadDataFromFile("dataStore/"+dataStoreDirXlsBusinessCardsRegionsName+".json");
    };
    loadDirXlsBusinessCardsRegions();
    app.get("/dirXlsBusinessCardsRegions/getXlsBusinessCardsRegionsDataForTable",function(req,res){
        loadDirXlsBusinessCardsRegions();
        res.send({columns:dataModel._getTableColumnsDataForHTable(tDirXlsBusinessCardsRegionsTableColumns),
            identifier:tDirXlsBusinessCardsRegionsTableColumns[0].data, items:dataStoreDirXlsBusinessCardsRegions
        });
    });
    app.post("/dirXlsBusinessCardsRegions/storeXlsBusinessCardsRegionsTableData",function(req,res){
        var data= req.body;
        if(!data){
            res.send({error:{error:"Failed store dirXlsBusinessCardsRegions record! Reason: no data for store.",
                message:"Невозможно сохранить запись! Нет данных для сохранения."}});
            return;
        }
        var chID= data["ChID"];
        if(chID==null){//append
            chID= dataStoreDirXlsBusinessCardsRegions.length; data["ChID"]= chID;
            dataStoreDirXlsBusinessCardsRegions[chID]= data;
        }else{//replace
            dataStoreDirXlsBusinessCardsRegions[chID]= data;
        }
        systemFuncs.saveDataToFile("/dataStore/"+dataStoreDirXlsBusinessCardsRegionsName+".json",dataStoreDirXlsBusinessCardsRegions);
        res.send({resultItem:data, updateCount:1});
    });
    app.post("/dirXlsBusinessCardsRegions/delXlsBusinessCardsRegionsTableData",function(req,res){
        var data= req.body;
        var delChID= (data)?data["ChID"]:null;
        if(delChID==null){
            res.send({error:{error:"Failed delete dirXlsBusinessCardsRegions record! Reason: no ChID.",
                message:"Невозможно удалить запись! Нет кода регистрации."}});
            return;
        }
        var delIndex= dataStoreDirXlsBusinessCardsRegions.findIndex(function(elem,index,arr){ return elem&&elem["ChID"]==delChID; });
        if(delIndex<0){
            res.send({error:{error:"Failed delete dirXlsBusinessCardsRegions record! Reason: dont find record for delete by ChID.",
                message:"Невозможно удалить запись! Не найдена запись для удаления по коду регистрации."}});
            return;
        }
        dataStoreDirXlsBusinessCardsRegions.splice(delIndex,1);
        systemFuncs.saveDataToFile("/dataStore/"+dataStoreDirXlsBusinessCardsRegionsName+".json",dataStoreDirXlsBusinessCardsRegions);
        res.send({resultItem:{"ChID":delChID}, updateCount:1});
    });
    module.exports.getDataForXlsBusinessCardsRegionsCombobox= function(callback){
        callback({items:dataStoreDirXlsBusinessCardsRegions});
    };
};
