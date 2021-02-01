var fs = require('fs'),
    server= require("../server"), log= server.log;

var loadedModules= {}, loadInitError= null, validateError= null;
module.exports.getLoadInitError= function(){ return loadInitError; };
module.exports.getValidateError= function(){ return validateError; };
/**
 * resultCallback = function(errsLoadInit,errsValidate, errMsgLoadInit,errMsgValidate), errs - object of validate errors
 */
module.exports.loadInitAndValidate= function(app,resultCallback){
    var modules= server.getAppConfigModules();
    if(!modules){ resultCallback(); return; }
    var moduleLoadInitValidateCallback= function(modules, index, errsLoadInit,errsValidate){
        var moduleName= modules[index];
        if(!moduleName){
            var errMsgLoadInit;
            for(var errItem in errsLoadInit){
                if(errMsgLoadInit){ errMsgLoadInit+= " ... (see more info)"; break; }
                errMsgLoadInit= errsLoadInit[errItem];
            }
            var errMsgValidate;
            for(var errItem in errsValidate){
                if(errMsgValidate){ errMsgValidate+= " ... (see more info)"; break; }
                errMsgValidate= errsValidate[errItem];
            }
            loadInitError= errMsgLoadInit; validateError= errMsgValidate;
            fillMainMenuModuleData(server.getAppConfigMenuItems());
            resultCallback(errsLoadInit,errsValidate,errMsgLoadInit,errMsgValidate);
            return;
        }
        var module;                                                                                             log.info('ValidateModule: module:'+moduleName+"...");//test
        try{
            module=require("./"+moduleName);
        }catch(e){                                                                                              log.error('FAILED validate module:'+moduleName+"! Reason:",e.message);//test
            errsLoadInit[moduleName+"_validateError"]= "Failed load module:"+moduleName+"! Reason:"+e.message;
            moduleLoadInitValidateCallback(modules, index + 1, errsLoadInit,errsValidate);
            return;
        }
        var moduleInited= false;
        if(!loadedModules[moduleName]){                                                                         log.info('Initing module '+moduleName+"...");//test
            var modulePageViewURL=null, modulePageViewFullPath= null;
            if(module.modulePageURL&&module.modulePagePath){
                modulePageViewURL= module.modulePageURL;
                modulePageViewFullPath= appPagesPath+module.modulePagePath;
                var sErrMsg;
                if(!fs.existsSync(modulePageViewFullPath)){                                                     log.error(sErrMsg='For module '+moduleName+" not exists page path! Path:",modulePageViewFullPath);
                    errsLoadInit[moduleName+"_pagePathError"]=sErrMsg+modulePageViewFullPath;
                }
            }else if(module.moduleViewURL&&module.moduleViewPath){
                modulePageViewURL= module.moduleViewURL;
                modulePageViewFullPath= appViewsPath+module.moduleViewPath;
                if(!fs.existsSync(modulePageViewFullPath)){                                                     log.error(sErrMsg='For module '+moduleName+" not exists page view path! Path:",modulePageViewFullPath);
                    errsLoadInit[moduleName+"_pageViewPathError"]=sErrMsg+modulePageViewFullPath;
                }
            }
            if(modulePageViewURL&&modulePageViewFullPath){
                (function(){
                    var modulePageViewFileFullPath= modulePageViewFullPath;
                    app.get(modulePageViewURL, function(req,res){
                        res.sendFile(modulePageViewFileFullPath);
                    });
                })();
            }
            try{
                module.init(app);
                moduleInited= true;
                loadedModules[moduleName]= module;
            }catch(e){                                                                                          log.error('FAILED inited module '+moduleName+"! Reason:", e.message);//test
                errsLoadInit[moduleName+"_initError"]= "Failed init module:"+moduleName+"! Reason:"+ e.message;
            }
        }
        if(!moduleInited){ moduleLoadInitValidateCallback(modules, index+1, errsLoadInit,errsValidate); return; }
        var validateModule= module.validateModule;
        if(!validateModule){                                                                                    log.warn('ValidateModule PASSED for Module:'+moduleName+"! Reason: no validate function.");//test
            errsValidate[moduleName+"_validateError"]= "Failed validate module:"+moduleName+"! Reason: no validate function!";
            moduleLoadInitValidateCallback(modules, index+1, errsLoadInit,errsValidate);
            return;
        }
        module.validateModule(errsLoadInit, function(){ moduleLoadInitValidateCallback(modules, index+1, errsLoadInit,errsValidate); });
    };
    moduleLoadInitValidateCallback(modules, 0, {},{});
};
function fillMainMenuItemModuleData(menuItem){
    if(!menuItem.module) return;
    var moduleName=menuItem.module;
    var loadedModuleInstance= loadedModules[moduleName];
    if(!loadedModuleInstance) return;
    menuItem.pageId= moduleName;
    menuItem.action= "open";
    menuItem.contentHref = loadedModuleInstance.modulePageURL||loadedModuleInstance.moduleViewURL;
}
function fillMainMenuModuleData(appMenu){
    if(!appMenu) return;
    for(var mainMenuItemIndex in appMenu) {
        var mainMenuItem= appMenu[mainMenuItemIndex];
        fillMainMenuItemModuleData(mainMenuItem);
        if(mainMenuItem.popupMenu){
            for(var popupMenuItemIndex in mainMenuItem.popupMenu) {
                var popupMenuItem= mainMenuItem.popupMenu[popupMenuItemIndex];
                fillMainMenuItemModuleData(popupMenuItem)
            }
        }
    }
}