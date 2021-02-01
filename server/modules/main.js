var server= require("../server"), log= server.log, appParams= server.getAppStartupParams(),
    appConfig= server.getAppConfig(), getAppConfigMenuItems= server.getAppConfigMenuItems,
    getAppConfigUsersRoles= server.getAppConfigUsersRoles, getAppConfigUsers= server.getAppConfigUsers,
    docxTemplates= require("./docxTemplates");

module.exports.validateModule = function(errs, nextValidateModuleCallback){ nextValidateModuleCallback(); };

function setUserMenuFromAppConfig(outData, userLogin, userRole, getAppConfigUsers, getAppConfigMenuItems, getAppConfigUsersRoles){
    var minAppMenuItems= ["menuBarItemHelpAbout","menuBarItemClose"];
    if(!getAppConfigMenuItems||!getAppConfigUsersRoles){ outData.menuBar= minAppMenuItems; return; }
    var appConfigUsersRoles= getAppConfigUsersRoles(), userRoleItems= appConfigUsersRoles[userRole],
        appMenuItems= getAppConfigMenuItems(),
        appConfigUsers= (getAppConfigUsers)?getAppConfigUsers():null, appConfigUserData= (appConfigUsers)?appConfigUsers[userLogin]:null;
    if(!userRoleItems&&userRole=="sysadmin"){
        outData.menuBar= appMenuItems||minAppMenuItems;
        if(appConfigUserData&&appConfigUserData.autorun) outData.autorun= appConfigUserData.autorun;
        return;
    }
    var userMenu=[];
    if(!appMenuItems||!appConfigUsersRoles){ outData.menuBar= minAppMenuItems; return; }
    if(!userRoleItems||!appMenuItems) userRoleItems= {menu:minAppMenuItems};
    var userRoleMenu= userRoleItems.menu;
    if(!userRoleMenu){ outData.menuBar= minAppMenuItems; return; }
    for(var i in userRoleMenu){
        var userRoleMenuItemName= userRoleMenu[i];
        for(var j in appMenuItems){
            var appMenuItem= appMenuItems[j];
            if(userRoleMenuItemName==appMenuItem.menuItemName){
                var userItem={};
                for(var item in appMenuItem) userItem[item]= appMenuItem[item];
                if(userItem.popupMenu) userItem.popupMenu=null;
                userMenu.push(userItem);
                break;
            }
            var mainPopupMenu= appMenuItem.popupMenu;
            if(!mainPopupMenu) continue;
            for(var k in mainPopupMenu){
                var popupMenuItem= mainPopupMenu[k];
                if(userRoleMenuItemName==popupMenuItem.menuItemName){
                    for(var l in userMenu){
                        var userMenuItem= userMenu[l];
                        if(userMenuItem.menuItemName==appMenuItem.menuItemName){
                            if(!userMenuItem.popupMenu) userMenuItem.popupMenu=[];
                            userMenuItem.popupMenu.push(popupMenuItem);
                        }
                    }
                }
            }
        }
    }
    outData.menuBar= userMenu;
    outData.autorun= (appConfigUserData&&appConfigUserData.autorun)?appConfigUserData.autorun:userRoleItems.autorun;
}


module.exports.modulePageURL= "/";
module.exports.modulePagePath= "main.html";
module.exports.init= function(app){
    if(!docxTemplates.setUserMenuDocxTemplatesFromAppConfig) throw new Error('NO docxTemplates.setUserMenuDocxTemplatesFromAppConfig!');
    app.get("/main/getMainData",function(req,res){
        var outData= { mode:appParams.mode, modeStr:appParams.mode };
        if(!appConfig||appConfig.error){
            outData.error= "Failed load application configuration!"+(appConfig&&appConfig.error)?" Reason:"+appConfig.error:"";
            res.send(outData);
            return;
        }
        outData.appConfig= {title:appConfig.title, icon32x32:appConfig.icon32x32, imageSmall:appConfig.imageSmall, imageMain:appConfig.imageMain};
        outData.appUserName= req.appUserName||"UNKNOWN"; outData.appUserRole= req.appUserRole||"UNKNOWN";
        setUserMenuFromAppConfig(outData, req.appUserLogin, req.appUserRole, getAppConfigUsers, getAppConfigMenuItems, getAppConfigUsersRoles);
        docxTemplates.setUserMenuDocxTemplatesFromAppConfig(outData.menuBar,server.getAppConfigDocxTemplates());
        res.send(outData);
    });
    app.post("/exit", function(req,res){
        var outData={}, cookiesArr=Object.keys(req.cookies);
        for(var i in cookiesArr) res.clearCookie(cookiesArr[i]);
        outData.actionResult="successful";
        res.send(outData);
    });
 };