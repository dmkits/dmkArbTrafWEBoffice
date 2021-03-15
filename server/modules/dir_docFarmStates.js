var dataModel=require(appDataModelPath);
var systemFuncs= require('../systemFuncs');

module.exports.validateModule = function(errs, nextValidateModuleCallback){ nextValidateModuleCallback(); };

module.exports.modulePageURL= "/dirDocFarmStates";
module.exports.modulePagePath= "dir_docFarmStates.html";
module.exports.init= function(app){
    var tDirDocFarmStatesTableColumns=[//Справочник параметров фарма
        {data:"FarmStateChID", name:"Код рег.", width:75, type:"text", align:"center", visible:false},
        {data:"FarmStateName", name:"Наименование статуса фарма", width:200, type:"text", align:"center"},
        {data:"FarmStateNote", name:"Примечание статуса фарма", width:500, type:"text", align:"center"},
        {data:"FarmStateNumber", name:"№ п/п статуса фарма", width:150, type:"numeric", align:"center"}
    ],
        tChIDDataName= tDirDocFarmStatesTableColumns[0]["data"];
    var dataStoreDirDocFarmStatesName="dataStoreDirDocFarmStates", dataStoreDirDocFarmStates=[], dataStoreDirDocFarmStatesIDs={};
    var loadDirDocFarmStates= function(){
        dataStoreDirDocFarmStates= systemFuncs.loadDataFromFile("dataStore/"+dataStoreDirDocFarmStatesName+".json");
    };
    var sortDirDocFarmStates= function(){
        if(!dataStoreDirDocFarmStates)return;
        dataStoreDirDocFarmStates.sort(function(a,b){
            var an= Number(a["FarmStateNumber"]), bn= Number(b["FarmStateNumber"]);
            var res= ((an<bn)?-1:((an>bn)?1:0));
            if(res)return res;
            var achid= a[tChIDDataName], bchid= b[tChIDDataName];
            return ((achid<bchid)?-1:((achid>bchid)?1:0));
        });
    };
    //loadDirDocFarmStates();
    //sortDirDocFarmStates();
    app.get("/dirDocFarmStates/getDirDocFarmStatesDataForTable",function(req,res){
        loadDirDocFarmStates();
        sortDirDocFarmStates();
        res.send({columns:dataModel._getTableColumnsDataForHTable(tDirDocFarmStatesTableColumns),
            identifier:tDirDocFarmStatesTableColumns[0].data, items:dataStoreDirDocFarmStates
        });
    });
    app.post("/dirDocFarmStates/storeDirDocFarmStatesTableData",function(req,res){
        var data= req.body;
        if(!data){
            res.send({error:{error:"Failed store DirDocFarmStates record! Reason: no data for store.",
                message:"Невозможно сохранить запись! Нет данных для сохранения."}});
            return;
        }
        var storeChID= data[tChIDDataName];
        if(storeChID==null){//append
            storeChID= systemFuncs.getUIDNumber();
            data[tChIDDataName]= storeChID;
            dataStoreDirDocFarmStates.push(data);
        }else{//replace
            var storeIndex= dataStoreDirDocFarmStates.findIndex(function(elem,index,arr){ return elem&&elem[tChIDDataName]==storeChID; });
            if(storeIndex<0){
                res.send({error:{error:"Failed store DirDocFarmStates record! Reason: dont find record for store by "+tChIDDataName+".",
                    message:"Невозможно сохранить запись! Не найдена запись для сохранения по коду регистрации."}});
                return;
            }
            dataStoreDirDocFarmStates[storeIndex]= data;
        }
        systemFuncs.saveDataToFile("/dataStore/"+dataStoreDirDocFarmStatesName+".json",dataStoreDirDocFarmStates);
        res.send({resultItem:data, updateCount:1});
    });
    app.post("/dirDocFarmStates/delDirDocFarmStatesTableData",function(req,res){
        var data= req.body;
        var delChID= (data)?data[tChIDDataName]:null;
        if(delChID==null){
            res.send({error:{error:"Failed delete DirDocFarmStates record! Reason: no "+tChIDDataName+"",
                message:"Невозможно удалить запись! Нет кода регистрации."}});
            return;
        }
        var delIndex= dataStoreDirDocFarmStates.findIndex(function(elem,index,arr){ return elem&&elem["ChID"]==delChID; });
        if(delIndex<0){
            res.send({error:{error:"Failed delete DirDocFarmStates record! Reason: dont find record for delete by "+tChIDDataName+".",
                message:"Невозможно удалить запись! Не найдена запись для удаления по коду регистрации."}});
            return;
        }
        dataStoreDirDocFarmStates.splice(delIndex,1);
        systemFuncs.saveDataToFile("/dataStore/"+dataStoreDirDocFarmStatesName+".json",dataStoreDirDocFarmStates);
        res.send({resultItem:{"ChID":delChID}, updateCount:1});
    });
    module.exports.getDataForXlsBusinessCardsCitiesCombobox= function(callback){
        callback({items:dataStoreDirDocFarmStates});
    };
};
