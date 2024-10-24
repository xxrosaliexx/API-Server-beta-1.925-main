
import { log } from "./log.js";
import * as utilities from "./utilities.js";
import Repository from "./models/repository.js";
import * as serverVariables from "./serverVariables.js"
import HttpContext from './httpContext.js';

let cachesExpirationTime = serverVariables.get("main.repository.CacheExpirationTime");

// Repository file data models cache
global.caches = [];
global.cachedCleanerStarted = false;

export default class CachedRequestManager {
    static startCachedRequestsCleaner() {
        /* démarre le processus de nettoyage des caches périmées */
        setInterval(CachedRequestManager.flushExpired, cachesExpirationTime * 1000);
        console.log(BgWhite + FgBlue, "[Periodic data caches cleaning process started...]");
    }

    static add(url, content, ETag= "") {
        /* mise en cache */
        if (!cachedCleanerStarted) {
            cachedCleanerStarted = true;
            CachedRequestManager.startCachedRequestsCleaner();
        }
        if (url!="" && !caches.some(cache => cache.url === url) ) {  //ajoute au cache si tu n'as pas déjà l'url
            CachedRequestManager.clear(url);
            caches.push({
                url,
                content,
                ETag,
                Expire_Time: utilities.nowInSeconds() + cachesExpirationTime
            });
            console.log(BgWhite + FgBlue, `[Data of ${url} repository has been cached]`);
        }

    }
    static find(url) {
        /* retourne la cache associée à l'url */
        try {
            if (url != "") {
                for (let cache of caches) {
                    if (cache.url == url) {
                        // renew cache
                        cache.Expire_Time = utilities.nowInSeconds() + cachesExpirationTime;
                        console.log(BgWhite + FgBlue, `[${cache.url} data retrieved from cache]`);
                        return cache;
                    }
                }
            }
        } catch (error) {
            console.log(BgWhite + FgRed, "[cache error!]", error);
        }
        return null;
    }
    static clear(url) {
        /* efface la cache associée à l’url */
        if (url != "") {
            let indexToDelete = [];
            let index = 0;
            for (let cache of caches) {
                if (cache.url == url) indexToDelete.push(index);
                index++;
            }
            utilities.deleteByIndex(caches, indexToDelete);
        }
    }
    static flushExpired() {
        /* efface les caches expirées */
        let now = utilities.nowInSeconds();
        for (let cache of caches) {
            if (cache.Expire_Time <= now) {
                console.log(BgWhite + FgBlue, "Cached file data of " + cache.url + ".json expired");
            }
        }
        caches = caches.filter( cache => cache.Expire_Time > now);
    }
    static get(HttpContext) {/* 
        
    Chercher la cache correspondant à l'url de la requête. Si trouvé,
    Envoyer la réponse avec 
    HttpContext.response.JSON( content, ETag, true /* from cache */
    console.log("get httpContext =" + HttpContext)
    let request = CachedRequestManager.find(HttpContext.req.url);
    if (request !=null) {
        return HttpContext.response.JSON(request.content, request.ETag, true);
    }
    return false;
    

}
}