var dataModel=require(appDataModelPath);
var systemFuncs= require('../systemFuncs');
var dir_xlsBusinessCardsRegions= require("./dir_xlsBusinessCardsRegions");

module.exports.validateModule = function(errs, nextValidateModuleCallback){ nextValidateModuleCallback(); };

module.exports.modulePageURL= "/dirXlsBusinessCardsCities";
module.exports.modulePagePath= "dir_xlsBusinessCardsCities.html";
module.exports.init= function(app){
    var tDirXlsBusinessCardsCitiesTableColumns=[//Область
        {data:"ChID", name:"Код рег.", width:75, type:"text", align:"center", visible:false},
        {data:"City", name:"Город", width:250, type:"text", align:"center"},
        {data:"Region", name:"Область", width:250, align:"center",
            type:"combobox", sourceURL:"/dirXlsBusinessCardsCities/getDataForXlsBusinessCardsRegionsCombobox"}
    ];
    var dataStoreDirXlsBusinessCardsCitiesName="dataStoreDirXlsBusinessCardsCities", dataStoreDirXlsBusinessCardsCities=[];
    var loadDirXlsBusinessCardsCities= function(){
        dataStoreDirXlsBusinessCardsCities= systemFuncs.loadDataFromFile("dataStore/"+dataStoreDirXlsBusinessCardsCitiesName+".json");
    };
    loadDirXlsBusinessCardsCities();
    app.get("/dirXlsBusinessCardsCities/getXlsBusinessCardsCitiesDataForTable",function(req,res){
        loadDirXlsBusinessCardsCities();
        res.send({columns:dataModel._getTableColumnsDataForHTable(tDirXlsBusinessCardsCitiesTableColumns),
            identifier:tDirXlsBusinessCardsCitiesTableColumns[0].data, items:dataStoreDirXlsBusinessCardsCities
        });
    });
    if(!dir_xlsBusinessCardsRegions.getDataForXlsBusinessCardsRegionsCombobox) throw new Error("NO dir_xlsBusinessCardsRegions.getDataForXlsBusinessCardsRegionsCombobox!");
    app.get("/dirXlsBusinessCardsCities/getDataForXlsBusinessCardsRegionsCombobox",function(req,res){
        dir_xlsBusinessCardsRegions.getDataForXlsBusinessCardsRegionsCombobox(function(result){ res.send(result); });
    });
    app.post("/dirXlsBusinessCardsCities/storeXlsBusinessCardsRegionsTableData",function(req,res){
        var data= req.body;
        if(!data){
            res.send({error:{error:"Failed store dirXlsBusinessCardsCities record! Reason: no data for store.",
                message:"Невозможно сохранить запись! Нет данных для сохранения."}});
            return;
        }
        var chID= data["ChID"];
        if(chID==null){//append
            chID= dataStoreDirXlsBusinessCardsCities.length; data["ChID"]= chID;
            dataStoreDirXlsBusinessCardsCities[chID]= data;
        }else{//replace
            dataStoreDirXlsBusinessCardsCities[chID]= data;
        }
        systemFuncs.saveDataToFile("/dataStore/"+dataStoreDirXlsBusinessCardsCitiesName+".json",dataStoreDirXlsBusinessCardsCities);
        res.send({resultItem:data, updateCount:1});
    });
    app.post("/dirXlsBusinessCardsCities/delXlsBusinessCardsCitiesTableData",function(req,res){
        var data= req.body;
        var delChID= (data)?data["ChID"]:null;
        if(delChID==null){
            res.send({error:{error:"Failed delete dirXlsBusinessCardsCities record! Reason: no ChID.",
                message:"Невозможно удалить запись! Нет кода регистрации."}});
            return;
        }
        var delIndex= dataStoreDirXlsBusinessCardsCities.findIndex(function(elem,index,arr){ return elem&&elem["ChID"]==delChID; });
        if(delIndex<0){
            res.send({error:{error:"Failed delete dirXlsBusinessCardsCities record! Reason: dont find record for delete by ChID.",
                message:"Невозможно удалить запись! Не найдена запись для удаления по коду регистрации."}});
            return;
        }
        dataStoreDirXlsBusinessCardsCities.splice(delIndex,1);
        systemFuncs.saveDataToFile("/dataStore/"+dataStoreDirXlsBusinessCardsCitiesName+".json",dataStoreDirXlsBusinessCardsCities);
        res.send({resultItem:{"ChID":delChID}, updateCount:1});
    });
    module.exports.getDataForXlsBusinessCardsCitiesCombobox= function(callback){
        callback({items:dataStoreDirXlsBusinessCardsCities});
    };
};
