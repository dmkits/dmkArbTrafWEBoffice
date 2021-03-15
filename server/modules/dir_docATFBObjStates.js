var dataModel=require(appDataModelPath);
var systemFuncs= require('../systemFuncs');

module.exports.validateModule = function(errs, nextValidateModuleCallback){ nextValidateModuleCallback(); };

module.exports.modulePageURL= "/dirDocATFBObjStates";
module.exports.modulePagePath= "dir_docATFBObjStates.html";
module.exports.init= function(app){
    var tDirDocATFBObjStatesTableColumns=[//Справочник параметров фарма
            {data:"FBObjStateChID", name:"Код рег. статуса объекта ФБ", width:150, type:"text", align:"center", visible:false},
            {data:"FBObjStateName", name:"Наименование статуса объекта ФБ", width:220, type:"text", align:"center"},
            {data:"FBObjStateNote", name:"Примечание статуса объекта ФБ", width:500, type:"text", align:"center"},
            {data:"FBObjStateNumber", name:"№ п/п статуса объекта ФБ", width:200, type:"numeric", align:"center"}
        ],
        tChIDDataName= tDirDocATFBObjStatesTableColumns[0]["data"];
    var dataStoreDirDocATFBObjStatesName="dataStoreDirDocATFBObjStates", dataStoreDirDocATFBObjStates=[];
    var loadDirDocATFBObjStates= function(){
        dataStoreDirDocATFBObjStates= systemFuncs.loadDataFromFile("dataStore/"+dataStoreDirDocATFBObjStatesName+".json");
    };
    var sortDirDocATFBObjStates= function(){
        if(!dataStoreDirDocATFBObjStates)return;
        dataStoreDirDocATFBObjStates.sort(function(a,b){
            var an= Number(a["FBObjStateNumber"]), bn= Number(b["FBObjStateNumber"]);
            var res= ((an<bn)?-1:((an>bn)?1:0));
            if(res)return res;
            var achid= a[tChIDDataName], bchid= b[tChIDDataName];
            return ((achid<bchid)?-1:((achid>bchid)?1:0));
        });
    };
    //loadDirDocATFBObjStates();
    //sortDirDocATFBObjStates();
    app.get("/dirDocATFBObjStates/getDirDocATFBObjStatesDataForTable",function(req,res){
        loadDirDocATFBObjStates();
        sortDirDocATFBObjStates();
        res.send({columns:dataModel._getTableColumnsDataForHTable(tDirDocATFBObjStatesTableColumns),
            identifier:tDirDocATFBObjStatesTableColumns[0].data, items:dataStoreDirDocATFBObjStates
        });
    });
    app.post("/dirDocATFBObjStates/storeDirDocATFBObjStatesTableData",function(req,res){
        var data= req.body;
        if(!data){
            res.send({error:{error:"Failed store DirDocATFBObjStates record! Reason: no data for store.",
                message:"Невозможно сохранить запись! Нет данных для сохранения."}});
            return;
        }
        var storeChID= data[tChIDDataName];
        if(storeChID==null){//append
            storeChID= systemFuncs.getUIDNumber();
            data[tChIDDataName]= storeChID;
            dataStoreDirDocATFBObjStates.push(data);
        }else{//replace
            var storeIndex= dataStoreDirDocATFBObjStates.findIndex(function(elem,index,arr){ return elem&&elem[tChIDDataName]==storeChID; });
            if(storeIndex<0){
                res.send({error:{error:"Failed store DirDocATFBObjStates record! Reason: dont find record for store by "+tChIDDataName+".",
                    message:"Невозможно сохранить запись! Не найдена запись для сохранения по коду регистрации."}});
                return;
            }
            dataStoreDirDocATFBObjStates[storeIndex]= data;
        }
        systemFuncs.saveDataToFile("/dataStore/"+dataStoreDirDocATFBObjStatesName+".json",dataStoreDirDocATFBObjStates);
        res.send({resultItem:data, updateCount:1});
    });
    app.post("/dirDocATFBObjStates/delDirDocATFBObjStatesTableData",function(req,res){
        var data= req.body;
        var delChID= (data)?data[tChIDDataName]:null;
        if(delChID==null){
            res.send({error:{error:"Failed delete DirDocATFBObjStates record! Reason: no "+tChIDDataName+"",
                message:"Невозможно удалить запись! Нет кода регистрации."}});
            return;
        }
        var delIndex= dataStoreDirDocATFBObjStates.findIndex(function(elem,index,arr){ return elem&&elem[tChIDDataName]==delChID; });
        if(delIndex<0){
            res.send({error:{error:"Failed delete DirDocATFBObjStates record! Reason: dont find record for delete by "+tChIDDataName+".",
                message:"Невозможно удалить запись! Не найдена запись для удаления по коду регистрации."}});
            return;
        }
        dataStoreDirDocATFBObjStates.splice(delIndex,1);
        systemFuncs.saveDataToFile("/dataStore/"+dataStoreDirDocATFBObjStatesName+".json",dataStoreDirDocATFBObjStates);
        var resultItem= {}; resultItem[tChIDDataName]= delChID;
        res.send({resultItem:resultItem, updateCount:1});
    });
    module.exports.getDataForXlsBusinessCardsCitiesCombobox= function(callback){
        callback({items:dataStoreDirDocATFBObjStates});
    };
};
