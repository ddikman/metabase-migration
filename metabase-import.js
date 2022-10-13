const axios = require("axios");
const fs = require("fs");

function withTrailingSlash(str) {
  if (str[str.length - 1] == '/') {
    return str
  }
  return str + '/'
}

async function importFun() {
  try {
    const IMPORT_HOST = withTrailingSlash(process.env["MB_IMPORT_HOST"]);  // for your changing environment like dev , staging , prod

    let jsonObj = await fs.readFileSync("./metabase/data.json", "utf8");
    jsonObj = JSON.parse(jsonObj);

    const destinationUrl = `${IMPORT_HOST}api/`;

    let dashboardMappingTable = new Map();
    let destinationDashboardMappingTable = new Map();
    let collectionMappingTable = new Map();
    let cardMappingTable = new Map();
    let destinationCardMappingTable = new Map();
    let destinationCollectionsMappingTable = new Map();

    // login in metabase

    const loginResult = await axios.post(`${destinationUrl}session/`, {
      username: process.env['MB_USERNAME'],
      password: process.env['MB_PASSWORD']
    });

    const metabaseSesstion = loginResult.data.id;

    // for metbase dashboards

    const destinationDashboards = await axios.get(
      `${destinationUrl}dashboard/`,
      {
        headers: {
          "X-Metabase-Session": metabaseSesstion
        }
      }
    );

    if (destinationDashboards.data) {
      for (const i of destinationDashboards.data) {
        // map destination dashboards name with id's
        destinationDashboardMappingTable.set(i.name, i.id);
      }
    }

    if (jsonObj.sourceDashboards) {
      for (const i of jsonObj.sourceDashboards) {
        const mappingTableValue = destinationDashboardMappingTable.get(i.name);

        if (mappingTableValue) {
          const updateDashboard = await axios.put(
            `${destinationUrl}dashboard/${mappingTableValue}`,
            i,
            {
              headers: {
                "X-Metabase-Session": metabaseSesstion
              }
            }
          );
          dashboardMappingTable.set(i.id, updateDashboard.data.id);
        } else {
          const addedDashboard = await axios.post(
            `${destinationUrl}dashboard`,
            i,
            {
              headers: {
                "X-Metabase-Session": metabaseSesstion
              }
            }
          );
          // map source dasboards id with new ceated destination id
          dashboardMappingTable.set(i.id, addedDashboard.data.id);
        }
      }
    }

    // for metabase collections

    const destinationCollections = await axios.get(
      `${destinationUrl}collection/`,
      {
        headers: {
          "X-Metabase-Session": metabaseSesstion
        }
      }
    );

    if (destinationCollections.data) {
      for (let i = 1; i < destinationCollections.data.length; i++) {
        // map destination collections name with id's
        destinationCollectionsMappingTable.set(
          destinationCollections.data[i].name,
          destinationCollections.data[i].id
        );
      }
    }

    if (jsonObj.sourceCollections) {
      for (let i = 1; i < jsonObj.sourceCollections.length; i++) {
        const mappingTableValue = destinationCollectionsMappingTable.get(
          jsonObj.sourceCollections[i].name
        );
        if (
          mappingTableValue &&
          jsonObj.sourceCollections[i].personal_owner_id == null
        ) {
          const updateCollection = await axios.put(
            `${destinationUrl}collection/${mappingTableValue}`,
            jsonObj.sourceCollections[i],
            {
              headers: {
                "X-Metabase-Session": metabaseSesstion
              }
            }
          );
          collectionMappingTable.set(
            jsonObj.sourceCollections[i].id,
            updateCollection.data.id
          );
        } else if (jsonObj.sourceCollections[i].personal_owner_id == null) {
          const addedCollection = await axios.post(
            `${destinationUrl}collection`,
            jsonObj.sourceCollections[i],
            {
              headers: {
                "X-Metabase-Session": metabaseSesstion
              }
            }
          );
          // map source collection id with new ceated destination id
          collectionMappingTable.set(
            jsonObj.sourceCollections[i].id,
            addedCollection.data.id
          );
        }
      }
    }

    // for metabase cards

    const destinationCards = await axios.get(`${destinationUrl}card/`, {
      headers: {
        "X-Metabase-Session": metabaseSesstion
      }
    });

    if (destinationCards.data) {
      for (const i of destinationCards.data) {
        // map destination cards name with id's
        destinationCardMappingTable.set(i.name, i.id);
      }
    }

    if (jsonObj.sourceCards) {
      for (const sourceCard of jsonObj.sourceCards) {
        sourceCard.collection_id = collectionMappingTable.get(sourceCard.collection_id) || null;

        const mappingTableValue = destinationCardMappingTable.get(sourceCard.name);

        if (mappingTableValue) {
          const updateCard = await axios.put(
            `${destinationUrl}card/${mappingTableValue}`,
            sourceCard,
            {
              headers: {
                "X-Metabase-Session": metabaseSesstion
              }
            }
          );
          cardMappingTable.set(sourceCard.id, updateCard.data.id);
        } else {
          const addedCards = await axios.post(`${destinationUrl}card`, sourceCard, {
            headers: {
              "X-Metabase-Session": metabaseSesstion
            }
          });
          // map source cards id with new ceated destination id
          cardMappingTable.set(sourceCard.id, addedCards.data.id);
        }
      }
    }

    // for metabase dashboard cards

    for (let i of jsonObj.sourceDashboardCards) {
      for (let j of i.ordered_cards) {
        let destinationDashboardId = dashboardMappingTable.get(j.dashboard_id);
        let destinationCardId = cardMappingTable.get(j.card_id);

        const addedDashboardCards = await axios.post(
          `${destinationUrl}dashboard/${destinationDashboardId}/cards`,
          { ...j, cardId: destinationCardId },
          {
            headers: {
              "X-Metabase-Session": metabaseSesstion
            }
          }
        );
      }
    }
  } catch (error) {
    return error;
  }
}

async function run () {
  const error = await importFun();
  if (error) {
    console.error(error)
  } else {
    console.log("Import done")
  }
}

run()