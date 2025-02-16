"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
/**
 * Get data from all collections
 * Suggestion from jcummings2 and leningsv
 * @param {Array<string>} collectionNameArray
 */
exports.getAllCollections = (collectionNameArray) => {
    const db = admin.firestore();
    // get all the root-level paths
    return new Promise((resolve) => {
        db.getCollections().then((snap) => {
            let paths = collectionNameArray;
            if (paths.length === 0) { // get all collections
                snap.forEach((collection) => paths.push(...collection['_referencePath'].segments));
            }
            // fetch in parallel
            let promises = [];
            paths.forEach((segment) => {
                let result = exports.backup(segment);
                promises.push(result);
            });
            // assemble the pieces into one object
            Promise.all(promises).then((value) => {
                let all = Object.assign({}, ...value);
                resolve(all);
            });
        });
    });
};
/**
 * Backup data from firestore
 *
 * @param {string} collectionName
 * @param {any} [subCollections=[]]
 * @returns {Promise<any>}
 */
exports.backup = (collectionName, subCollections = []) => {
    // console.log('Geting data from: ', collectionName);
    return new Promise((resolve, reject) => {
        const db = admin.firestore();
        let data = {};
        data[collectionName] = {};
        let results = db.collection(collectionName)
            .get()
            .then(snapshot => {
            snapshot.forEach(doc => {
                data[collectionName][doc.id] = doc.data();
            });
            return data;
        })
            .catch(error => {
            console.log(error);
        });
        results.then((dt) => {
            // console.log('dt ', dt);
            for (var key in dt) {
                // skip loop if the property is from prototype
                if (!dt.hasOwnProperty(key))
                    continue;
                var obj = dt[key];
                for (var prop in obj) {
                    // skip loop if the property is from prototype
                    if (!obj.hasOwnProperty(prop))
                        continue;
                    // your code
                    // console.log(prop + " = " + obj[prop]);
                    db.doc(`agreement/${prop}`).getCollections().then((sdd) => __awaiter(this, void 0, void 0, function* () {
                        let temp = [];
                        for (const sd of sdd) {
                            temp.push(sd.id);
                            //console.log(`Found subcollection with id: ${sd.id}`);
                        }
                        //console.log('temp ', temp);
                        if (typeof subCollections === 'string')
                            subCollections = [subCollections];
                        if (subCollections.length === 2000) {
                            resolve(dt);
                        }
                        else {
                            let count = 0;
                            // fetch in parallel
                            let promises = [];
                            yield new Promise((resolve, reject) => {
                                temp.forEach((subCollection) => __awaiter(this, void 0, void 0, function* () {
                                    // console.log(' temp aray ', subCollection);
                                    //  console.log('before get subcollection');
                                    yield getSubCollection(db, data, dt, collectionName, subCollection).then(() => {
                                        count++;
                                        // console.log('after get subcollection');
                                        if (count === 5) {
                                            resolve(data);
                                            promises.push(data);
                                        }
                                    }).catch(error => {
                                        console.log(error);
                                        reject(error);
                                    });
                                }));
                                Promise.all(promises).then((value) => {
                                    let all = Object.assign({}, ...value);
                                    resolve(all);
                                });
                            });
                        }
                    }));
                }
            }
        }).catch(error => {
            console.log(error);
            reject(error);
        });
    });
};
/**
 * Get sub collection from a document if possible
 *
 * @param {any} db
 * @param {any} data
 * @param {any} dt
 * @param {any} collectionName
 * @param {any} subCollection
 */
const getSubCollection = (db, data, dt, collectionName, subCollection) => __awaiter(this, void 0, void 0, function* () {
    // console.log('getsubcollection')
    for (let [key, value] of Object.entries([dt[collectionName]][0])) {
        if (data[collectionName][key]['subCollections'] == null) {
            data[collectionName][key]['subCollections'] = {};
        }
        data[collectionName][key]['subCollections'][subCollection] = {};
        yield addSubCollection(db, key, data[collectionName][key]['subCollections'][subCollection], collectionName, subCollection);
    }
});
/**
 * Add sub collection to data object if possible
 *
 * @param {any} db
 * @param {any} key
 * @param {any} subData
 * @param {any} collectionName
 * @param {any} subCollection
 * @returns
 */
const addSubCollection = (db, key, subData, collectionName, subCollection) => {
    // console.log('addSubCollection');
    return new Promise((resolve, reject) => {
        db.collection(collectionName).doc(key).collection(subCollection).get()
            .then(snapshot => {
            snapshot.forEach(subDoc => {
                subData[subDoc.id] = subDoc.data();
            });
            resolve('Added data');
        }).catch(error => {
            reject(false);
            console.log(error);
        });
    });
};
//# sourceMappingURL=export.js.map