var dataModel=require(appDataModelPath);
var systemFuncs= require('../systemFuncs');
var dir_xlsBusinessCardsRegions= require("./dir_xlsBusinessCardsRegions"), dir_xlsBusinessCardsCities= require("./dir_xlsBusinessCardsCities"),
    dir_xlsBusinessCardsIndustries= require("./dir_xlsBusinessCardsIndustries");

module.exports.validateModule = function(errs, nextValidateModuleCallback){ nextValidateModuleCallback(); };

module.exports.modulePageURL= "/docFarmFB";
module.exports.modulePagePath= "doc_farmFB.html";
module.exports.init= function(app){
    var tDocFarbFBTableColumns=[//ФИО	Имя (нужно для удобства копирования столбцов при эл.рассылке)	E-mail	Телефон	Компания	Должность	Город	Область	Отрасль
        {data:"FBaccChID", name:"Код рег.акка", width:75, type:"text", align:"center", visible:false},
        {data:"FBaccRegDatetime", name:"Дата регистрации", width:75, type:"text",datetimeFormat:"DD.MM.YYYY HH:mm:ss",align:"center", useFilter:false },
        {data:"UIDFBacc", name:"ИД ФБ акка", width:120, type:"text", align:"center"},
        {data:"FBaccRegName", name:"ФИО регистрации акка", width:120, type:"text", align:"center"},
        {data:"FBaccRegData", name:"Данные регистрации акка<br>(почта/тел)", width:200, type:"text", align:"center"},
        {data:"FBaccPass", name:"Пароль акка", width:150, type:"text", align:"center"},
        {data:"FBaccRegEmail", name:"E-mail акка", width:200, type:"text", align:"center"},
        {data:"FBaccRegTel", name:"Телефон акка", width:100, type:"text", align:"center"},
        {data:"FBaccRegBornDate", name:"Дата рожд. в акке", width:75, type:"text",datetimeFormat:"DD.MM.YYYY",align:"center", useFilter:false },
        {data:"FBaccNotes", name:"Примечания акка", width:300, type:"text", align:"left"},
        {data:"FBaccState", name:"Статус акка", width:150, type:"text", align:"left"}

        //{data:"FBaccRegDatetime", name:"Дата регистрации", width:100, type:"text",datetimeFormat:"DD.MM.YY HH:mm:ss",align:"center", useFilter:false },

        //{data:"Post", name:"Должность", width:150, type:"text", align:"center"},
        /*{data:"City", name:"Город", width:240, align:"center",
            type:"combobox", sourceURL:"/docFarmFB/getDataForXlsBusinessCardsCitiesCombobox"},
        {data:"Region", name:"Область", width:150, align:"center",
            type:"combobox", sourceURL:"/docFarmFB/getDataForXlsBusinessCardsRegionsCombobox"},
        {data:"Industry", name:"Отрасль", width:250, align:"center",
            type:"combobox", sourceURL:"/docFarmFB/getDataForXlsBusinessCardsIndustryCombobox"}*/
    ];
    var dataStoreDocFarmFBName="dataStoreDocFarmFB", dataStoredocFarmFB=[];
    app.get("/docFarmFB/getDocFarmFBDataForTable",function(req,res){
        dataStoredocFarmFB= systemFuncs.loadDataFromFile("dataStore/"+dataStoreDocFarmFBName+".json");
        res.send({columns:dataModel._getTableColumnsDataForHTable(tDocFarbFBTableColumns), identifier:tDocFarbFBTableColumns[0].data, items:dataStoredocFarmFB});
    });
    //if(!dir_xlsBusinessCardsCities.getDataForXlsBusinessCardsCitiesCombobox) throw new Error("NO dir_xlsBusinessCardsCities.getDataForXlsBusinessCardsCitiesCombobox!");
    //app.get("/docFarmFB/getDataForXlsBusinessCardsCitiesCombobox",function(req,res){
    //    dir_xlsBusinessCardsCities.getDataForXlsBusinessCardsCitiesCombobox(function(result){ res.send(result); });
    //});
    //if(!dir_xlsBusinessCardsRegions.getDataForXlsBusinessCardsRegionsCombobox) throw new Error("NO dir_xlsBusinessCardsRegions.getDataForXlsBusinessCardsRegionsCombobox!");
    //app.get("/docFarmFB/getDataForXlsBusinessCardsRegionsCombobox",function(req,res){
    //    dir_xlsBusinessCardsRegions.getDataForXlsBusinessCardsRegionsCombobox(function(result){ res.send(result); });
    //});
    //if(!dir_xlsBusinessCardsIndustries.getDataForXlsBusinessCardsIndustryCombobox) throw new Error("NO dir_xlsBusinessCardsIndustries.getDataForXlsBusinessCardsIndustryCombobox!");
    //app.get("/docFarmFB/getDataForXlsBusinessCardsIndustryCombobox",function(req,res){
    //    dir_xlsBusinessCardsIndustries.getDataForXlsBusinessCardsIndustryCombobox(function(result){ res.send(result); });
    //});
    app.post("/docFarmFB/storeXlsBusinessCardsTableData",function(req,res){
        var data= req.body;
        if(!data){
            res.send({error:{error:"Failed store docFarmFB record! Reason: no data for store.",
                message:"Невозможно сохранить запись! Нет данных для сохранения."}});
            return;
        }
        var storeFBaccChID= data["FBaccChID"];
        if(storeFBaccChID==null){//append
            storeFBaccChID= dataStoredocFarmFB.length; data["ChID"]= storeFBaccChID;
            dataStoredocFarmFB[storeFBaccChID]= data;
        }else{//replace
            dataStoredocFarmFB[storeFBaccChID]= data;
        }
        systemFuncs.saveDataToFile("/dataStore/"+dataStoreDocFarmFBName+".json",dataStoredocFarmFB);
        res.send({resultItem:data, updateCount:1});
    });
    app.post("/docFarmFB/delXlsBusinessCardsTableData",function(req,res){
        var data= req.body;
        var delFBaccChID= (data)?data["FBaccChID"]:null;
        if(delFBaccChID==null){
            res.send({error:{error:"Failed delete docFarmFB record! Reason: no ChID.",
                message:"Невозможно удалить запись! Нет кода регистрации."}});
            return;
        }
        var delIndex= dataStoredocFarmFB.findIndex(function(elem,index,arr){ return elem&&elem["FBaccChID"]==delFBaccChID; });
        if(delIndex<0){
            res.send({error:{error:"Failed delete docFarmFB record! Reason: dont find record for delete by ChID.",
                message:"Невозможно удалить запись! Не найдена запись для удаления по коду регистрации."}});
            return;
        }
        dataStoredocFarmFB.splice(delIndex,1);
        systemFuncs.saveDataToFile("/dataStore/"+dataStoreDocFarmFBName+".json",dataStoredocFarmFB);
        res.send({resultItem:{"FBaccChID":delFBaccChID}, updateCount:1});
    });
};
