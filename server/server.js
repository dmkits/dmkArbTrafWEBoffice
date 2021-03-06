var startDateTime= new Date(), startTime= startDateTime.getTime();                                  console.log('STARTING at',startDateTime );//test
try{
    var ENV= process.env.NODE_ENV;                                                                  if(ENV=="development") console.log("START IN DEVELOPMENT MODE");
    var systemFuncs= require('./systemFuncs'), appStartupParams= systemFuncs.getStartupParams();    console.log('Started with startup params:',appStartupParams);//test
    var logDebug= (ENV=='development' || (appStartupParams && appStartupParams.logDebug));          if(logDebug) console.log("DEBUG LOG ON");
    module.exports.logDebug = logDebug;
    var path= require('path'), fs= require('fs'), dateformat= require('dateformat'),
        winston= require('winston'), DailyRotateFile= require('winston-daily-rotate-file');         console.log('Modules path, fs, dateformat, winston loaded');//test
} catch(e){                                                                                         console.log("FAILED START! Reason:",e.message);
    return;
}
module.exports.getAppStartupParams = function(){ return appStartupParams; };                        console.log('Started with startup params:',appStartupParams);//test

const logDir= path.join(__dirname, '/../logs/');
try {
    if(!fs.existsSync(logDir)){ fs.mkdirSync(logDir); }
}catch(e){                                                                                          console.log("FAILED START! Reason: Failed create log directory! Reason:",e.message);
    return;
}
var transports= [], logConsole= winston.transports.Console;
transports.push(new DailyRotateFile({
    filename:path.join(logDir,"syslog-%DATE%.log"), datePattern:'YYYY-MM-DD',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(function(log){
            var splat= log[Symbol.for('splat')], s="";
            for(var k in splat){
                var val= splat[k];
                s+= " "+((val!==undefined&&typeof(val)!="object")?val.toString():JSON.stringify(val));
            }
            return JSON.stringify({timestamp:dateformat(Date.now(),"yyyy-mm-dd HH:MM:ss.l"),level:log.level,message:log.message+s,metadata:splat});
        })
    )
}));
if(appStartupParams.logToConsole){
    transports.push(
        new winston.transports.Console({ level:(logDebug)?'silly':'info',
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(function(log){
                    var splat= log[Symbol.for('splat')], s="";
                    for(var k in splat){
                        var val= splat[k];
                        s+= " "+((val!==undefined&&typeof(val)!="object")?val.toString():JSON.stringify(val));
                    }
                    return dateformat(Date.now(),"yyyy-mm-dd HH:MM:ss.l")+" | "+log.level+": "+log.message+s;
                })
            )
        })
    );
}
var log= winston.createLogger({transports:transports, level:(logDebug)?'silly':'info'});
module.exports.log= log;                                                                            log.info('Module log inited on',new Date().getTime()-startTime);

global.sysConfigPath= path.join(__dirname,'/../','');
var sysConfig=null;
function loadSysConfig(){
    try{
        sysConfig= systemFuncs.loadConfig(appStartupParams.mode+'.cfg');
    }catch(e){
        sysConfig= null;
        log.error("Failed to load system configuration! Reason:",e.message);
    }
}
loadSysConfig();                                                                                    log.info('system configuration loaded on',new Date().getTime()-startTime);
if(!sysConfig){ log.error("NO SYSTEM CONFIGURATION! Application cannot start!"); return; }
module.exports.loadSysConfig= loadSysConfig;                                                        log.info('app startup mode:',appStartupParams.mode,' system config:',sysConfig);
module.exports.getSysConfig= function(){ return sysConfig };
module.exports.setSysConfig= function(newSysConfig){ sysConfig= newSysConfig; };

var getAppConfigName= function(){ return (sysConfig&&sysConfig.configName)?sysConfig.configName:'config';},
    appConfig= JSON.parse(systemFuncs.getJSONWithoutComments(fs.readFileSync('./'+getAppConfigName()+'.json','utf-8')));
if(!appConfig){                                                                                     log.error("FAILED LOAD APPLICATION CONFIG! Reason: config is empty.");
    return;
}
module.exports.getAppConfigName= getAppConfigName;
module.exports.getAppConfig= function(){ return appConfig; };
module.exports.getAppConfigModules= function(){ return (appConfig&&appConfig.modules)?appConfig.modules:null; };
if(!appConfig.modules||!appConfig.modules.length){                                                  log.error("FAILED LOAD APPLICATION CONFIG MODULES! Reason: no modules.");
    return;
}
module.exports.getAppConfigUsers= function(){ return (appConfig&&appConfig.users)?appConfig.users:null; };
if(!appConfig.users){                                                                               log.error("FAILED LOAD APPLICATION CONFIG USERS! Reason: no users.");
    return;
}
module.exports.getAppConfigUsersRoles= function(){ return (appConfig&&appConfig.usersRoles)?appConfig.usersRoles:null; };
module.exports.getAppConfigMenuItems= function(){ return (appConfig&&appConfig.menuItems)?appConfig.menuItems:null; };
if(!appConfig.menuItems||!appConfig.menuItems.length){                                              log.error("FAILED LOAD APPLICATION CONFIG MENU ITEMS! Reason: no menu items.");
    return;
}
var configDocxTemplatesName= appConfig["configDocxTemplates"];
if(!configDocxTemplatesName){                                                                       log.error('FAILED start server! Reason: no configDocxTemplates in system config.');
    return;
}
var appConfigDocxTemplates= JSON.parse(systemFuncs.getJSONWithoutComments(fs.readFileSync('./'+configDocxTemplatesName+'.json','utf-8')));
module.exports.getAppConfigDocxTemplates= function(){ return appConfigDocxTemplates; };

var tempExcelRepDir= path.join(__dirname, '/../temp/');
try{
    if(!fs.existsSync(tempExcelRepDir)) fs.mkdirSync(tempExcelRepDir);
}catch(e){                                                                                          log.warn('Failed create XLSX_temp directory! Reason:',e);
    tempExcelRepDir=null;
}
module.exports.getTempExcelRepDir= function(){ return tempExcelRepDir };

var appServerComponentsVersion= (sysConfig.appServerComponentsVersion)?"_"+sysConfig.appServerComponentsVersion:"";
global.appModulesPath= path.join(__dirname,'/modules'+appServerComponentsVersion+'/','');
global.appDataModelPath= path.join(__dirname,'/datamodel'+appServerComponentsVersion+'/','');
global.appPagesPath= path.join(__dirname,'/../pages/','');
global.appViewsPath= path.join(__dirname,'/../pages'+appServerComponentsVersion+'/','');

try{
    var appModules= require(appModulesPath);                                                        log.info('application server modules loaded on',new Date().getTime()-startTime);
}catch(e){
    log.error("FAILED LOAD APPLICATION SERVER MODULES! Reason:",e.message,"\nApplication cannot start!");
    return;
}

var express= require('express');                                                                    log.info('express loaded on',new Date().getTime()-startTime );
var server= express();
module.exports.getApp= function(){ return server; };
var bodyParser= require('body-parser');                                                             log.info('body-parser loaded on',new Date().getTime()-startTime );
var cookieParser= require('cookie-parser');                                                         log.info('cookie-parser loaded on',new Date().getTime()-startTime );
//server.use(function(req,res,next){/*IT'S FOR TEST*/                                                 log.info("SERVER:",req.method,req.path,"params=",req.query,{});//log.info("SERVER: req.headers=",req.headers,"req.cookies=",req.cookies,{});
//    next();
//});
server.use(cookieParser());
server.use(bodyParser.urlencoded({extended:true,limit:'5mb'}));
server.use(bodyParser.json({limit:'5mb'}));
server.use(bodyParser.text({limit:'5mb'}));
server.use('/',express.static('public'));
server.set('view engine','ejs');

require('./accessCfg')(server);

var startServer= function(){
    server.listen(appStartupParams.port,function (err){
        if(err){ console.error("listen port err= ", err); return; }
        console.log("server runs on port " + appStartupParams.port+" on "+(new Date().getTime()-startTime));
        log.info("server runs on port " + appStartupParams.port+" on "+(new Date().getTime()-startTime));
    });                                                                                             log.info("server inited.");
};

appModules.loadInitAndValidate(server,function(errsLoadInit,errsValidate, errMsgLoadInit,errMsgValidate){
    if(errMsgLoadInit){                                                                             log.error("FAILED application modules load/init! Reason: ",errMsgLoadInit);
    }
    if(errMsgValidate){                                                                             log.error("FAILED application modules validate! Reason: ",errMsgValidate);
    }
    if(!errMsgLoadInit)startServer(); else log.error("FAILED START SERVER! Reason: ",errMsgLoadInit);
});

process.on("uncaughtException",function(err){
    log.error(err);
    console.log("uncaughtException=",err);
});

