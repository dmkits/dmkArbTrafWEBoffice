var dataModel=require(appDataModelPath);
var systemFuncs= require('../systemFuncs');

module.exports.validateModule = function(errs, nextValidateModuleCallback){ nextValidateModuleCallback(); };

module.exports.modulePageURL= "/dirXlsBusinessCardsIndustries";
module.exports.modulePagePath= "dir_xlsBusinessCardsIndustries.html";
module.exports.init= function(app){
    var tDirXlsBusinessCardsIndustriesTableColumns=[//Отрасль
        {data:"ChID", name:"Код рег.", width:75, type:"text", align:"center", visible:false},
        {data:"Industry", name:"Отрасль", width:500, type:"text", align:"center"}
    ];
    var dataStoreDirXlsBusinessCardsIndustriesName="dataStoreDirXlsBusinessCardsIndustries", dataStoreDirXlsBusinessCardsIndustries=[];
    var loadDirXlsBusinessCardsIndustries= function(){
        dataStoreDirXlsBusinessCardsIndustries= systemFuncs.loadDataFromFile("dataStore/"+dataStoreDirXlsBusinessCardsIndustriesName+".json");
    };
    loadDirXlsBusinessCardsIndustries();
    app.get("/dirXlsBusinessCardsIndustries/getXlsBusinessCardsIndustriesDataForTable", function(req, res){
        loadDirXlsBusinessCardsIndustries();
        res.send({columns:dataModel._getTableColumnsDataForHTable(tDirXlsBusinessCardsIndustriesTableColumns),
            identifier:tDirXlsBusinessCardsIndustriesTableColumns[0].data, items:dataStoreDirXlsBusinessCardsIndustries
        });
    });
    app.post("/dirXlsBusinessCardsIndustries/storeXlsBusinessCardsIndustriesTableData",function(req,res){
        var data= req.body;
        if(!data){
            res.send({error:{error:"Failed store dirXlsBusinessCardsIndustries record! Reason: no data for store.",
                message:"Невозможно сохранить запись! Нет данных для сохранения."}});
            return;
        }
        var chID= data["ChID"];
        if(chID==null){//append
            chID= dataStoreDirXlsBusinessCardsIndustries.length; data["ChID"]= chID;
            dataStoreDirXlsBusinessCardsIndustries[chID]= data;
        }else{//replace
            dataStoreDirXlsBusinessCardsIndustries[chID]= data;
        }
        systemFuncs.saveDataToFile("/dataStore/"+dataStoreDirXlsBusinessCardsIndustriesName+".json",dataStoreDirXlsBusinessCardsIndustries);
        res.send({resultItem:data, updateCount:1});
    });
    app.post("/dirXlsBusinessCardsIndustries/delXlsBusinessCardsIndustriesTableData",function(req,res){
        var data= req.body;
        var delChID= (data)?data["ChID"]:null;
        if(delChID==null){
            res.send({error:{error:"Failed delete dirXlsBusinessCardsIndustries record! Reason: no ChID.",
                message:"Невозможно удалить запись! Нет кода регистрации."}});
            return;
        }
        var delIndex= dataStoreDirXlsBusinessCardsIndustries.findIndex(function(elem,index,arr){ return elem&&elem["ChID"]==delChID; });
        if(delIndex<0){
            res.send({error:{error:"Failed delete dirXlsBusinessCardsIndustries record! Reason: dont find record for delete by ChID.",
                message:"Невозможно удалить запись! Не найдена запись для удаления по коду регистрации."}});
            return;
        }
        dataStoreDirXlsBusinessCardsIndustries.splice(delIndex,1);
        systemFuncs.saveDataToFile("/dataStore/"+dataStoreDirXlsBusinessCardsIndustriesName+".json",dataStoreDirXlsBusinessCardsIndustries);
        res.send({resultItem:{"ChID":delChID}, updateCount:1});
    });
    module.exports.getDataForXlsBusinessCardsIndustryCombobox= function(callback){
        callback({items:dataStoreDirXlsBusinessCardsIndustries});
    };
};
