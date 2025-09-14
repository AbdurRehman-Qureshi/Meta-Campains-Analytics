const monday = require("../config/mondayClient");
require('dotenv').config();

async function pullMondayBoardData(boardId) {
  try {
    // Query for all items on the board with their column values
    const query = `
  query {
    boards(ids: ${boardId}) {
      name
      items_page {
        items {
          id
          name
          column_values {
            id
            text
            value
            column {
              title
              settings_str
            }
          }
        }
      }
    }
  }
`;


    const response = await monday.api(query);
    console.log('Raw Monday API response:', response);

    if (!response.data || !response.data.boards) {
      console.error('Monday API response missing boards:', response.data);
      return;
    }

    const board = response.data.boards[0];

    console.log(`Board Name: ${board.name}`);
    board.items_page.items.forEach(item => {
      console.log(`Item: ${item.name} (ID: ${item.id})`);
      item.column_values.forEach(col => {
        console.log(`  ${col.column.title}: ${col.text}`);
      });
    });
  } catch (err) {
    console.error("Error pulling Monday board data:", err.message);
  }
}

module.exports = pullMondayBoardData;

