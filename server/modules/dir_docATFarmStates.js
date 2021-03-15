var dataModel=require(appDataModelPath);
var systemFuncs= require('../systemFuncs');

module.exports.validateModule = function(errs, nextValidateModuleCallback){ nextValidateModuleCallback(); };

module.exports.modulePageURL= "/dirDocATFarmStates";
module.exports.modulePagePath= "dir_docATFarmStates.html";
module.exports.init= function(app){
    var tDirDocATFarmStatesTableColumns=[//Справочник параметров фарма
        {data:"FarmStateChID", name:"Код рег. статуса фарма", width:75, type:"text", align:"center", visible:false},
        {data:"FarmStateName", name:"Наименование статуса фарма", width:200, type:"text", align:"center"},
        {data:"FarmStateNote", name:"Примечание статуса фарма", width:500, type:"text", align:"center"},
        {data:"FarmStateNumber", name:"№ п/п статуса фарма", width:150, type:"numeric", align:"center"}
    ],
        tChIDDataName= tDirDocATFarmStatesTableColumns[0]["data"];
    var dataStoreDirDocATFarmStatesName="dataStoreDirDocATFarmStates", dataStoreDirDocATFarmStates=[], dataStoreDirDocATFarmStatesIDs={};
    var loadDirDocATFarmStates= function(){
        dataStoreDirDocATFarmStates= systemFuncs.loadDataFromFile("dataStore/"+dataStoreDirDocATFarmStatesName+".json");
    };
    var sortDirDocATFarmStates= function(){
        if(!dataStoreDirDocATFarmStates)return;
        dataStoreDirDocATFarmStates.sort(function(a,b){
            var an= Number(a["FarmStateNumber"]), bn= Number(b["FarmStateNumber"]);
            var res= ((an<bn)?-1:((an>bn)?1:0));
            if(res)return res;
            var achid= a[tChIDDataName], bchid= b[tChIDDataName];
            return ((achid<bchid)?-1:((achid>bchid)?1:0));
        });
    };
    //loadDirDocATFarmStates();
    //sortDirDocATFarmStates();
    app.get("/dirDocATFarmStates/getDirDocATFarmStatesDataForTable",function(req,res){
        loadDirDocATFarmStates();
        sortDirDocATFarmStates();
        res.send({columns:dataModel._getTableColumnsDataForHTable(tDirDocATFarmStatesTableColumns),
            identifier:tDirDocATFarmStatesTableColumns[0].data, items:dataStoreDirDocATFarmStates
        });
    });
    app.post("/dirDocATFarmStates/storeDirDocATFarmStatesTableData",function(req,res){
        var data= req.body;
        if(!data){
            res.send({error:{error:"Failed store DirDocATFarmStates record! Reason: no data for store.",
                message:"Невозможно сохранить запись! Нет данных для сохранения."}});
            return;
        }
        var storeChID= data[tChIDDataName];
        if(storeChID==null){//append
            storeChID= systemFuncs.getUIDNumber();
            data[tChIDDataName]= storeChID;
            dataStoreDirDocATFarmStates.push(data);
        }else{//replace
            var storeIndex= dataStoreDirDocATFarmStates.findIndex(function(elem,index,arr){ return elem&&elem[tChIDDataName]==storeChID; });
            if(storeIndex<0){
                res.send({error:{error:"Failed store DirDocATFarmStates record! Reason: dont find record for store by "+tChIDDataName+".",
                    message:"Невозможно сохранить запись! Не найдена запись для сохранения по коду регистрации."}});
                return;
            }
            dataStoreDirDocATFarmStates[storeIndex]= data;
        }
        systemFuncs.saveDataToFile("/dataStore/"+dataStoreDirDocATFarmStatesName+".json",dataStoreDirDocATFarmStates);
        res.send({resultItem:data, updateCount:1});
    });
    app.post("/dirDocATFarmStates/delDirDocATFarmStatesTableData",function(req,res){
        var data= req.body;
        var delChID= (data)?data[tChIDDataName]:null;
        if(delChID==null){
            res.send({error:{error:"Failed delete DirDocATFarmStates record! Reason: no "+tChIDDataName+"",
                message:"Невозможно удалить запись! Нет кода регистрации."}});
            return;
        }
        var delIndex= dataStoreDirDocATFarmStates.findIndex(function(elem,index,arr){ return elem&&elem[tChIDDataName]==delChID; });
        if(delIndex<0){
            res.send({error:{error:"Failed delete DirDocATFarmStates record! Reason: dont find record for delete by "+tChIDDataName+".",
                message:"Невозможно удалить запись! Не найдена запись для удаления по коду регистрации."}});
            return;
        }
        dataStoreDirDocATFarmStates.splice(delIndex,1);
        systemFuncs.saveDataToFile("/dataStore/"+dataStoreDirDocATFarmStatesName+".json",dataStoreDirDocATFarmStates);
        var resultItem= {}; resultItem[tChIDDataName]= delChID;
        res.send({resultItem:resultItem, updateCount:1});
    });
    module.exports.getDataForXlsBusinessCardsCitiesCombobox= function(callback){
        callback({items:dataStoreDirDocATFarmStates});
    };
};
