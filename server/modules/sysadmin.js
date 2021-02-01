var path= require('path'), fs= require('fs');
var server= require('../server'), log= server.log,
    appStartupParams= server.getAppStartupParams(),
    getSysConfig= server.getSysConfig, setSysConfig= server.setSysConfig, loadSysConfig=server.loadSysConfig,
    getAppConfig= server.getAppConfig;
var systemFuncs= require('../systemFuncs');
var appModules= require(appModulesPath),
    getAppModulesLoadInitErr= appModules.getLoadInitError, getAppModulesValidateErr= appModules.getValidateError;

module.exports.validateModule = function(errs, nextValidateModuleCallback){ nextValidateModuleCallback(); };

module.exports.modulePageURL= "/sysadmin";
module.exports.modulePagePath= "sysadmin.html";
module.exports.init = function(app){
    app.get("/sysadmin/sysState",function(req,res){
        var revalidateModules= false;
        if(req.query&&req.query["REVALIDATE"]) revalidateModules= true;
        var outData= {mode:appStartupParams.mode, port:appStartupParams.port, appUserName:req.appUserName},
            sysConfig= getSysConfig();
        if(!sysConfig||sysConfig.error){
            outData.error= (sysConfig&&sysConfig.error)?sysConfig.error:"unknown";
            res.send(outData);
            return;
        }
        outData.sysConfig= sysConfig;
        outData.appConfig= getAppConfig();
        if(!revalidateModules){
            outData.appModulesLoadInitErr= getAppModulesLoadInitErr();
            outData.appModulesValidationErr= getAppModulesValidateErr();
            res.send(outData);
            return;
        }
        appModules.loadInitAndValidate(app,function(errsLoadInit,errsValidate,errMsgLoadInit,errMsgValidate){
            outData.appModulesLoadInitErr= errMsgLoadInit;
            outData.appModulesValidationErr= errMsgValidate;
            res.send(outData);
        });
    });
    app.get("/sysadmin/sysConfig",function(req,res){
        res.sendFile(appViewsPath+'sysConfig.html');
    });
    app.get("/sysadmin/sysConfig/getSysConfig",function(req,res){
        var sysConfig= getSysConfig();
        if(!sysConfig||sysConfig.error){
            res.send({error:(sysConfig&&sysConfig.error)?sysConfig.error:"unknown"});
            return;
        }
        res.send(sysConfig);
    });
    app.get("/sysadmin/sysConfig/loadSysConfig",function(req,res){
        loadSysConfig();
        var sysConfig= getSysConfig();
        if(!sysConfig){ res.send({error: "Failed load system config!"}); return; }
        res.send(sysConfig);
    });
    app.post("/sysadmin/sysConfig/storeSysConfig",function(req,res){
        var newServerConfig= req.body;
        systemFuncs.saveConfig(appStartupParams.mode+".cfg",newServerConfig,function(err){
            var outData={};
            if(err){
                outData.error = "Failed to store system config! Reason: "+err+". New system config not applied!";
                res.send(outData);
                return;
            }
            setSysConfig(newServerConfig);
            outData.message="System config stored, applied and revalidate modules.";
            appModules.loadInitAndValidate(app,function(errsLoadInit,errsValidate,errMsgLoadInit,errMsgValidate){
                outData.appModulesLoadInitErr= errMsgLoadInit;
                outData.appModulesValidationErr= errMsgValidate;
                res.send(outData);
            });
        });
    });
    app.get("/sysadmin/logs",function(req,res){
        res.sendFile(appViewsPath+'logs.html');
    });
    var sysLogsTableColumns=[
        {data:"level", name:"Level", width:80, align:"center", type:"text"},
        {data:"message", name:"Message", width:700, type:"text"},
        {data:"timestamp", name:"Timestamp", width:120, align:"center", type:"text", datetimeFormat:"DD.MM.YY HH:mm:ss"}
    ];
    app.get('/sysadmin/logs/getDataForTable',function(req,res){
        var fileDate = req.query.DATE, outData = {};
        outData.columns = sysLogsTableColumns;
        if(!fileDate){ res.send(outData); return; }
        var logFile = path.join(__dirname + "/../../logs/syslog-"+fileDate+".log");
        try {
            fs.existsSync(logFile);
            var fileDataStr = fs.readFileSync(logFile, "utf8");
        }catch(e){
            if(e.code== 'ENOENT'){
                log.info("There are no logs for " +fileDate+".");
                outData.error = "There are no logs for " +fileDate+".";
                res.send(outData);
                return;
            }
            log.error("Impossible to read logs! Reason:",e);
            outData.error = "Impossible to read logs! Reason:"+e.message;
            res.send(outData);
            return;
        }
        var sPos=0, strObj, jsonObj, items=[];
        while(true){
            var ePos= fileDataStr.indexOf("\n",sPos);
            if(ePos<0) break;
            strObj = fileDataStr.substring(sPos,ePos);
            try {
                jsonObj= JSON.parse(strObj);
            }catch(e){
                var sErr= "Failed JSON.parse log data item! Reason:";
                log.error(sErr,e);
                res.send({error:sErr+e.message});
                return;
            }
            items.push(jsonObj);
            sPos=ePos+1;
        }
        outData.items= items;
        res.send(outData);
    });
};