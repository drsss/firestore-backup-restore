import * as admin from 'firebase-admin';

/**
 * Get data from all collections 
 * Suggestion from jcummings2 and leningsv
 * @param {Array<string>} collectionNameArray
 */
export const getAllCollections = (collectionNameArray): Promise<any> => {
    const db = admin.firestore();
    // get all the root-level paths
    return new Promise((resolve) => {
        db.getCollections().then((snap) => {
            let paths = collectionNameArray;
            
            if(paths.length === 0) { // get all collections
                snap.forEach((collection) => paths.push(...collection['_referencePath'].segments));            
            }            
            
            // fetch in parallel
            let promises = [];
            paths.forEach((segment) => {
                let result = backup(segment);
                promises.push(result);
            });
            // assemble the pieces into one object
            Promise.all(promises).then((value) => {
                let all = Object.assign({}, ...value);                       
                resolve(all);
            });
        });
    })    
}

/**
 * Backup data from firestore
 * 
 * @param {string} collectionName 
 * @param {any} [subCollections=[]]
 * @returns {Promise<any>} 
 */
export const backup = (collectionName: string, subCollections = []): Promise<any> => {
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
                })
                return data;
            })
            .catch(error => {
                console.log(error);
            })

        results.then((dt:any) => {
           // console.log('dt ', dt);
            for (var key in dt) {
                // skip loop if the property is from prototype
                if (!dt.hasOwnProperty(key)) continue;
            
                var obj = dt[key];
                for (var prop in obj) {
                    // skip loop if the property is from prototype
                    if(!obj.hasOwnProperty(prop)) continue;
            
                    // your code
                   // console.log(prop + " = " + obj[prop]);
                    db.doc(`agreement/${prop}`).getCollections().then(sdd => {
                        let temp = [];
                        for (const sd of sdd) {








                            
                           temp.push(sd.id);
                           //console.log(`Found subcollection with id: ${sd.id}`);
                        }
                        //console.log('temp ', temp);
                        if (typeof subCollections === 'string') subCollections = [subCollections];
                        if (subCollections.length === 2000) {
                            resolve(dt);
                        } else {
                            let count = 0;
                            // fetch in parallel

                            let promises = [];
                            // paths.forEach((segment) => {
                            //     let result = backup(segment);
                            //     promises.push(result);
                            // });
                            // assemble the pieces into one object
                            
                           new Promise((resolve, reject) => {
                                temp.forEach(subCollection => {
                                   // console.log(' temp aray ', subCollection);
    
                                    getSubCollection(db, data, dt, collectionName, subCollection).then(() => {
                                        count++;
                                        if (count === temp.length) {
                                            resolve(data)
                                            promises.push(data);
                                        }
                                    }).catch(error => {
                                        console.log(error);
                                        reject(error);
                                    })
                                })
                                Promise.all(promises).then((value) => {
                                    let all = Object.assign({}, ...value);                       
                                    resolve(all);
                                });
                            });
                        
                        }
                    })
                }
            }
            
        }).catch(error => {
            console.log(error)
            reject(error);
        })
    })

}

/**
 * Get sub collection from a document if possible
 * 
 * @param {any} db 
 * @param {any} data 
 * @param {any} dt 
 * @param {any} collectionName 
 * @param {any} subCollection 
 */
const getSubCollection = async (db, data, dt, collectionName, subCollection) => {
   // console.log('getsubcollection')
    for (let [key, value] of Object.entries([dt[collectionName]][0])) {
        if (data[collectionName][key]['subCollections'] == null) {
            data[collectionName][key]['subCollections'] = {};
        }
        data[collectionName][key]['subCollections'][subCollection] = {};
        await addSubCollection(db, key, data[collectionName][key]['subCollections'][subCollection], collectionName, subCollection);
    }
}

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
    return new Promise((resolve, reject) => {
        db.collection(collectionName).doc(key).collection(subCollection).get()
            .then(snapshot => {
                snapshot.forEach(subDoc => {
                    subData[subDoc.id] = subDoc.data();
                })
                resolve('Added data');
            }).catch(error => {
                reject(false);
                console.log(error);
            })
    })
}
