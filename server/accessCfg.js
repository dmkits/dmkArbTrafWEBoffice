//var path= require('path'), fs= require('fs');
var server= require("./server"), log= server.log,
    appStartupParams= server.getAppStartupParams(), getSysConfig= server.getSysConfig,
    getAppConfigName= server.getAppConfigName, getAppConfig= server.getAppConfig, getAppConfigUsers= server.getAppConfigUsers,
    systemFuncs= require("./systemFuncs"),
    appModules= require(appModulesPath), sysadmin= require(appModulesPath+"sysadmin");

/**
 * appUsers= { uuid:<user parameters> }
 * <user parameters> = { login, pswrd, isSysadmin, appUserName, appUserRole }
 */
var sysadminsList={}, appUsers={};
/**
 * params = { uuid, login, password }
 * callback (err,appUserData), err = { error,errorMessage }, appUserData = { login, pswrd, isSysadmin, appUserName, appUserRole }
 */
var createNewAppUser= function(params,callback){
    if(!params){ callback({error:"FAILED create new application user! Reason: NO parameters for create new user."}); return; }
    if(!getAppConfigUsers){ callback({error:"FAILED create new application user! Reason: NO getAppConfigUsers."}); return; }
    var appConfigUsers= getAppConfigUsers();
    if(!appConfigUsers){ callback({error:"FAILED create new application user! Reason: NO application users."}); return; }
    var uuid= params.uuid;
    if(!uuid||uuid.toString().trim()==""){ callback({error:"FAILED create new application user! Reason: NO user uuid."}); return; }
    var login= params.login;
    if(!login||login.toString().trim()==""){ callback({error:"FAILED create new application user! Reason: NO user login."}); return; }
    var pswrd= params.password;
    if(!pswrd||pswrd.toString().trim()==""){ callback({error:"FAILED create new application user! Reason: NO user password."}); return; }
    var appConfigUserData= appConfigUsers[login];
    if(!appConfigUserData||appConfigUserData.pswrd!=pswrd){
        callback({error:"User login failed! Reason: Wrong login or password.", message:"Неудачная попытка входа пользователя \""+login+"\"!<br> Неверное имя и/или пароль."});
        return;
    }
    var appUserData= { userLogin:login,userLoginPswrd:pswrd, appUserName:appConfigUserData.name, appUserRole:appConfigUserData.userRole };
    if(appConfigUserData.sysadmin) appUserData["isSysadmin"]= true;
    appUsers[uuid]= appUserData;
    callback(null,appUserData)
};
/**
 * return appUserData = { login, pswrd, isSysadmin, appUserName, appUserRole }
 */
var getAppUserData= function(uuid){ return (appUsers)?appUsers[uuid]:null; };

module.exports= function(app){
    var getAIDCN= function(){//get application ID or if not exists application config name
        var appConfig= (getAppConfig)?getAppConfig():null;
        if(appConfig&&appConfig.appID) return appConfig.appID;
        return (getAppConfigName)?getAppConfigName():null;
    };
    var isReqJSON = function(method,headers){
        return (headers && (
            (headers["x-requested-with"] && headers["x-requested-with"] == "application/json; charset=utf-8")
                || (headers["x-requested-with"] && headers["x-requested-with"].indexOf("application/json; charset=utf-8")>=0) )
        )
    };
    var isReqInternalPage = function(method,headers){
        return (headers && headers["x-requested-with"] == "XMLHttpRequest" && headers["content-type"] == "application/x-www-form-urlencoded");
    };
    var isMobileReq= function(req){
        var userAgent=req.headers["user-agent"];
        if(!userAgent) return false;
        return (userAgent.indexOf("Android")>=0||userAgent.indexOf("Mobile")>=0);
    };
    var getIsMobileApp= function(req){//if req from mobile application
        //'user-agent': 'Mozilla/5.0 (Linux; Android 4.4.2; CipherLab RS30 Build/KOT49H) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Crosswalk/23.53.589.4 Mobile Safari/537.36', - device CipherLab RS30
        //'user-agent': 'Mozilla/5.0 (Linux; Android 4.4.2; Android SDK built for x86 Build/KK) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Crosswalk/23.53.589.4 Mobile Safari/537.36', -AndroidStudio
        //'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1', -Chrome mobile test like iPhine
        //'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.80 Mobile Safari/537.36', -Chrome mobile test like Responsive
        if(!req||!req.headers) return false;
        var reqHeadersUserAgent= req.headers['user-agent'];
        return (reqHeadersUserAgent&&reqHeadersUserAgent.indexOf("Crosswalk/")>=0);
    };
    var setAccessControlAllowOriginForMapp= function(req,res){
        var isMobileApp= getIsMobileApp(req);
        if(isMobileApp&&req.method=="OPTIONS"&&req.headers["origin"]=="file://"&&req.path=="/login"&&req.headers["access-control-request-method"]=="POST"){
            res.header("Access-Control-Allow-Method","POST");
            res.header("Access-Control-Allow-Origin","file://");
        }else if(isMobileApp&&req.method=="OPTIONS"&&req.headers["origin"]=="file://"&&req.headers["access-control-request-headers"]
                &&req.headers["access-control-request-headers"].indexOf("x-requested-with")>=0
                &&req.headers["access-control-request-headers"].indexOf("uuid")>=0){
            res.header("Access-Control-Allow-Origin","file://");
        }else if(isMobileApp&&req.method!=="OPTIONS"&&req.headers["origin"]=="file://"&&isReqJSON(req.method,req.headers)){
            res.header("Access-Control-Allow-Origin","file://");
        }
    };
    var renderToLogin= function(res,loginMsg){
        var appConfig=getAppConfig();
        res.render(appPagesPath+"login.ejs", {title:(appConfig&&appConfig.title)?appConfig.title:"",loginMsg:loginMsg});
    };
    var renderIsMobile= function(req,res,next){
        if(req.originalUrl.indexOf("/mobile")==0){ req.isMobile=true; next(); return true; }
        if(isMobileReq(req)){
            if(isReqJSON(req.method,req.headers) || isReqInternalPage(req.method,req.headers)){
                req.isMobile=true; next(); return true;
            }
            req.isMobile=true; res.redirect('/mobile');
            return true;
        }
        return false;
    };
    var renderToAccessFailed= function(req,res,msg){
        if(isReqInternalPage(req.method,req.headers)){
            res.render(appPagesPath+"accessFailedInternal.ejs", {errorReason:msg});
            return;
        }
        //req.dbSysadminName
        var appConfig=getAppConfig();
        res.render(appPagesPath+"accessFailed.ejs",
            {title:(appConfig&&appConfig.title)?appConfig.title:"",errorReason:msg,
                bigImg:(appConfig)?appConfig.imageMain:"",icon:(appConfig)?appConfig.icon32x32:"", clearSession:null});
    };
    /**
     * failResult = { error, userErrorMsg, pageMsg}
     */
    var accessFail= function(req,res,next,failResult){
        if(!failResult) failResult={error:"Access FAIL!",userErrorMsg:"Доступ не удался!",pageMsg:"Доступ не удался!"};
        if(isReqJSON(req.method,req.headers)){
            res.send({error:{error:failResult.error,userMessage:failResult.userErrorMsg}}); return;
        }
        if(renderIsMobile(req,res,next))return;
        if(isReqInternalPage(req.method,req.headers))renderToAccessFailed(req,res,failResult.pageMsg);
        renderToLogin(res,failResult.pageMsg);
    };
    //var readSysadminsUUIDList= function(){
    //    try{
    //        var readSysadminsList= JSON.parse(fs.readFileSync(path.join(__dirname,"../sysadmins.json")));
    //        sysadminsList=readSysadminsList;
    //    }catch(e){
    //        if(e.code=='ENOENT'){
    //            var readSysadminsList={};
    //            try{
    //                fs.writeFileSync(path.join(__dirname,"../sysadmins.json"), JSON.stringify(readSysadminsList),{flag:"w"});
    //                sysadminsList=readSysadminsList;
    //            }catch(e2){
    //            }
    //        }
    //    }
    //};
    var getSysadminLoginByUUID= function(uuid){
        if(!sysadminsList) return;
        for(var saUUID in sysadminsList)
            if(saUUID==uuid) return sysadminsList[saUUID];
    };

    app.use(function(req,res,next){                                                                             //log.info("ACCESS CONTROLLER:",req.method,req.path,"params=",req.query,{});//log.info("ACCESS CONTROLLER: req.headers=",req.headers,"req.cookies=",req.cookies,{});
        var isMobileApp= getIsMobileApp(req);
        if(isMobileApp) res.header("Access-Control-Allow-Headers","origin, Content-Type,Content-Length, Accept, X-Requested-With, uuid,aidcn");
        setAccessControlAllowOriginForMapp(req,res);
        if(req.originalUrl.indexOf("/login")==0){ next(); return; }                                             //log.info("ACCESS CONTROLLER: req.headers=",req.headers," req.cookies=",req.cookies,{});
        var reqAIDCN= (isMobileApp)?req.headers['aidcn']:req.cookies['aidcn'], aidcn= getAIDCN(),
            uuid= (isMobileApp)?req.headers['uuid']:req.cookies['uuid'],
            sysadminLogin= getSysadminLoginByUUID(uuid);                                                          log.info(uuid,"ACCESS CONTROLLER:",req.method,req.path,"params=",req.query,"data=",req.body);//log.info("ACCESS CONTROLLER: req.headers=",req.headers,"req.cookies=",req.cookies,{});
        if(!isMobileApp&&uuid==null&&reqAIDCN==null) reqAIDCN= aidcn;
        if(reqAIDCN==null){
            accessFail(req,res,next,{
                error: "Failed to get data! Reason: no application config identifier!",
                userErrorMsg: "Не удалось получить данные. <br>Не удалось определить идентификатор приложения.",
                pageMsg: "<div>Доступ к приложению невозможен. <br>Не удалось определить идентификатор приложения. "+
                    "<br>Обратитесь к системному администратору!</div>"
            });
            return;
        }
        if(reqAIDCN!=aidcn){
            var msgPostfix= (!sysadminLogin)?"Обратитесь к системному администратору.":"Попытка доступа к приложению с идентификатором \""+aidcn+"\".";
            accessFail(req,res,next,{
                error: "Failed to get data! Reason: application config identifier non correct!",
                userErrorMsg: "Не удалось получить данные! <br>Неверный идентификатор приложения. <br>"+msgPostfix,
                pageMsg: "<div>Доступ к приложению невозможен! <br>Неверный идентификатор приложения. <br>"+msgPostfix+"</div>"
            });
            return;
        }
        if(uuid==null){
            accessFail(req,res,next,{
                error: "Failed to get data! Reason: user is not authorized!",
                userErrorMsg: "Не удалось получить данные. <br>Пользователь не авторизирован. <br>Необходимо авторизироваться.",
                pageMsg: "<div>Пользователь не авторизирован. <br>Необходимо авторизироваться.</div>"
            });
            return;
        }
        var appUserData= getAppUserData(uuid);
        if(sysadminLogin) req.dbSysadminName= sysadminLogin;
        if(!appUserData){
            accessFail(req,res,next,{
                error: "Failed to get data! Reason: user is not authorized!",
                userErrorMsg: "Не удалось получить данные. <br>Время авторизированного доступа истекло. <br>Нужно авторизироваться повторно.",
                pageMsg: "<div>Время сессии истекло. <br>Необходима авторизация.</div>"
            });
            return;
        }
        req.appUserDataParams= appUserData; req.appUserLogin= appUserData["userLogin"];
        req.appUserName= appUserData["appUserName"]; req.appUserRole= appUserData["appUserRole"];               log.info(uuid,req.appUserName,'ACCESS CONTROLLER: appUserDataParams=',req.appUserDataParams);
        req.appEmpName= appUserData["appUserName"];
        if(!sysadminLogin&&(req.originalUrl=="/sysadmin"||req.originalUrl.indexOf("/sysadmin/")==0)){
            var errMsg="Невозможно получить данные! Пользователь не авторизирован как сисадмин!";
            if (isReqJSON(req.method,req.headers)) {
                res.send({ error:{error:"Failed to get data! Reason: login user is not sysadmin!",userMessage:errMsg} });
                return;
            }
            renderToAccessFailed(req,res,errMsg);
            return;
        }
        if(sysadminLogin&&(req.originalUrl=="/sysadmin"||req.originalUrl.indexOf("/sysadmin/")==0)){
            if(renderIsMobile(req,res,next))return;
            next();
            return;
        }
        var modulesInitLoadError= appModules.getLoadInitError();
        if(modulesInitLoadError){
            accessFail(req,res,next,{
                error: "Failed to get data! Reason: failed load/init application modules!",
                userErrorMsg: "Невозможно получить данные! Не все модули приложения были корректно загружены! Обратитесь к системному администратору!",
                pageMsg:'<div><p><span style="color:red">Вход невозможен! <br>Не все модули приложения были корректно загружены! '+
                '<br>Обратитесь к системному администратору!</span></p></div>'
            });
            return;
        }
        var modulesValidateError= appModules.getValidateError();
        if(modulesValidateError){
            accessFail(req,res,next,{
                error: "Failed to get data! Reason: application modules not valid!",
                userErrorMsg: "Невозможно получить данные! Модули приложения не прошли проверку! Обратитесь к системному администратору!",
                pageMsg:'<div><p><span style="color:red">Вход невозможен! <br>Проверка модулей приложения завершилась неудачно! '+
                '<br>Обратитесь к системному администратору!</span></p></div>'
            });
            return;
        }
        if(renderIsMobile(req,res,next))return;
        next();
    });

    app.get("/login",function(req,res){                                                                         log.info("LOGIN","UNKNOWN","ACCESS CONTROLLER: get /login");
        renderToLogin(res,"");
    });
    /**
     * sysadminData = { uuid, login }
     */
    var storeSysadminUUID= function(sysadminData, callback){
        sysadminsList[sysadminData.uuid]= sysadminData.login;
        //fs.writeFile(path.join(__dirname,"../sysadmins.json"), JSON.stringify(sysadminsList),{flag:"w"}, function(err){
        //    if(err){                                                                                            log.error("storeSysadminUUID: Failed store sysadmins data! Reason:",err);
        //    }
        //    if(callback)callback();
        //});
    };
    app.post("/login",function(req,res){                                                                        log.info("LOGIN PROCESS",req.body.login,"ACCESS CONTROLLER: post /login login=",req.body.login,'pswrd=',req.body.pswrd);
        var login= req.body.login, loginPswrd= req.body.pswrd;
        if(!login ||!loginPswrd){
            res.send({ error:{error:"Authorisation failed! No login or password!",userMessage:"Пожалуйста введите имя и пароль."} });
            return;
        }
        var uuid= systemFuncs.getUIDNumber();
        createNewAppUser({uuid:uuid,login:login,password:loginPswrd}, function(err,appUserData){
            if(err){ res.send({error:err}); return; }
            var isSysadmin= appUserData["isSysadmin"],
                appMode= (appStartupParams)?appStartupParams.mode:null,
                appModeIsDebug= !appMode||(appMode.toLocaleLowerCase().indexOf("debug")>=0)||(appMode.toLocaleLowerCase().indexOf("test")>=0),
                appConfig= (getAppConfig)?getAppConfig():null,
                appName= (appConfig)?(appConfig.title||appConfig.appID):"UNKNOWN",
                appVer= (appConfig)?appConfig.appVer:null, appCVer= (appConfig)?appConfig.appCVer:null;
            var outData= {"uuid":uuid,
                appName:appName, appVerSrv:appVer, appCVer:appCVer,
                mode:appMode, modeIsDebug:appModeIsDebug
            };
            if(isSysadmin) storeSysadminUUID({uuid:uuid,login:login});
            if(!getIsMobileApp(req)){
                res.cookie("uuid",uuid);
                var aidcn= getAIDCN();
                if(aidcn) res.cookie("aidcn",aidcn);
            }
            outData.appUserName= appUserData["appUserName"]; outData.appUserRole= appUserData["appUserRole"];
            outData.appEmpName= appUserData["appUserName"];
            res.send(outData);
        });
    });
};