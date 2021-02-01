var dataModel=require(appDataModelPath);
var systemFuncs= require('../systemFuncs');
var dir_xlsBusinessCardsRegions= require("./dir_xlsBusinessCardsRegions"), dir_xlsBusinessCardsCities= require("./dir_xlsBusinessCardsCities"),
    dir_xlsBusinessCardsIndustries= require("./dir_xlsBusinessCardsIndustries");

module.exports.validateModule = function(errs, nextValidateModuleCallback){ nextValidateModuleCallback(); };

module.exports.modulePageURL= "/docXlsBusinessCards";
module.exports.modulePagePath= "doc_xlsBusinessCards.html";
module.exports.init= function(app){
    var tXlsBusinessCardsTableColumns=[//ФИО	Имя (нужно для удобства копирования столбцов при эл.рассылке)	E-mail	Телефон	Компания	Должность	Город	Область	Отрасль
        {data:"ChID", name:"Код рег.", width:75, type:"text", align:"center", visible:false},
        {data:"ContactInitials", name:"ФИО", width:200, type:"text", align:"center"},
        {data:"ContactName", name:"Имя", width:100, type:"text", align:"center"},
        {data:"Email", name:"E-mail", width:120, type:"text", align:"center"},
        {data:"Telephone", name:"Телефон", width:120, type:"text", align:"center"},
        {data:"Company", name:"Компания", width:200, type:"text", align:"left"},
        {data:"Post", name:"Должность", width:150, type:"text", align:"center"},
        {data:"City", name:"Город", width:240, align:"center",
            type:"combobox", sourceURL:"/docXlsBusinessCards/getDataForXlsBusinessCardsCitiesCombobox"},
        {data:"Region", name:"Область", width:150, align:"center",
            type:"combobox", sourceURL:"/docXlsBusinessCards/getDataForXlsBusinessCardsRegionsCombobox"},
        {data:"Industry", name:"Отрасль", width:250, align:"center",
            type:"combobox", sourceURL:"/docXlsBusinessCards/getDataForXlsBusinessCardsIndustryCombobox"}
    ];
    var dataStoreDocXlsBusinessCardsName="dataStoreDocXlsBusinessCards", dataStoreDocXlsBusinessCards=[];
    app.get("/docXlsBusinessCards/getXlsBusinessCardsDataForTable",function(req,res){
        dataStoreDocXlsBusinessCards= systemFuncs.loadDataFromFile("dataStore/"+dataStoreDocXlsBusinessCardsName+".json");
        res.send({columns:dataModel._getTableColumnsDataForHTable(tXlsBusinessCardsTableColumns), identifier:tXlsBusinessCardsTableColumns[0].data, items:dataStoreDocXlsBusinessCards});
    });
    if(!dir_xlsBusinessCardsCities.getDataForXlsBusinessCardsCitiesCombobox) throw new Error("NO dir_xlsBusinessCardsCities.getDataForXlsBusinessCardsCitiesCombobox!");
    app.get("/docXlsBusinessCards/getDataForXlsBusinessCardsCitiesCombobox",function(req,res){
        dir_xlsBusinessCardsCities.getDataForXlsBusinessCardsCitiesCombobox(function(result){ res.send(result); });
    });
    if(!dir_xlsBusinessCardsRegions.getDataForXlsBusinessCardsRegionsCombobox) throw new Error("NO dir_xlsBusinessCardsRegions.getDataForXlsBusinessCardsRegionsCombobox!");
    app.get("/docXlsBusinessCards/getDataForXlsBusinessCardsRegionsCombobox",function(req,res){
        dir_xlsBusinessCardsRegions.getDataForXlsBusinessCardsRegionsCombobox(function(result){ res.send(result); });
    });
    if(!dir_xlsBusinessCardsIndustries.getDataForXlsBusinessCardsIndustryCombobox) throw new Error("NO dir_xlsBusinessCardsIndustries.getDataForXlsBusinessCardsIndustryCombobox!");
    app.get("/docXlsBusinessCards/getDataForXlsBusinessCardsIndustryCombobox",function(req,res){
        dir_xlsBusinessCardsIndustries.getDataForXlsBusinessCardsIndustryCombobox(function(result){ res.send(result); });
    });
    app.post("/docXlsBusinessCards/storeXlsBusinessCardsTableData",function(req,res){
        var data= req.body;
        if(!data){
            res.send({error:{error:"Failed store docXlsBusinessCards record! Reason: no data for store.",
                message:"Невозможно сохранить запись! Нет данных для сохранения."}});
            return;
        }
        var chID= data["ChID"];
        if(chID==null){//append
            chID= dataStoreDocXlsBusinessCards.length; data["ChID"]= chID;
            dataStoreDocXlsBusinessCards[chID]= data;
        }else{//replace
            dataStoreDocXlsBusinessCards[chID]= data;
        }
        systemFuncs.saveDataToFile("/dataStore/"+dataStoreDocXlsBusinessCardsName+".json",dataStoreDocXlsBusinessCards);
        res.send({resultItem:data, updateCount:1});
    });
    app.post("/docXlsBusinessCards/delXlsBusinessCardsTableData",function(req,res){
        var data= req.body;
        var delChID= (data)?data["ChID"]:null;
        if(delChID==null){
            res.send({error:{error:"Failed delete docXlsBusinessCards record! Reason: no ChID.",
                message:"Невозможно удалить запись! Нет кода регистрации."}});
            return;
        }
        var delIndex= dataStoreDocXlsBusinessCards.findIndex(function(elem,index,arr){ return elem&&elem["ChID"]==delChID; });
        if(delIndex<0){
            res.send({error:{error:"Failed delete docXlsBusinessCards record! Reason: dont find record for delete by ChID.",
                message:"Невозможно удалить запись! Не найдена запись для удаления по коду регистрации."}});
            return;
        }
        dataStoreDocXlsBusinessCards.splice(delIndex,1);
        systemFuncs.saveDataToFile("/dataStore/"+dataStoreDocXlsBusinessCardsName+".json",dataStoreDocXlsBusinessCards);
        res.send({resultItem:{"ChID":delChID}, updateCount:1});
    });
};
