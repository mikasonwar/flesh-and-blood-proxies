import { Component } from "preact";
import CardResult from "./CardResult";
import styled from "styled-components";

const CardListDiv = styled.div`
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;

  @media only screen and (max-width: 1320px) {
    grid-template-columns: repeat(4, 1fr);
  }

  @media only screen and (max-width: 980px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media only screen and (max-width: 820px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media only screen and (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`

export default class CardList extends Component {
  render() {
    const {
      cards = [],
      addCardToChosenCards = null,
      removeCardFromChosenCards = null,
      changeCardPrintingFromChosenCards = null,
      chosenList = false,
    } = this.props;

    let rendered_cards;
    if (chosenList) {
      const groupedCards = cards.reduce((result, entry) => {
        const existingEntry = result.find((group) => group.card.unique_id === entry.card.unique_id);

        if (existingEntry) {
          existingEntry.quantity += 1;
          if (existingEntry.printing.unique_id !== entry.printing.unique_id) {
            existingEntry.hasMixedPrintings = true;
          }
          return result;
        }

        result.push({
          card: entry.card,
          printing: entry.printing,
          quantity: 1,
          hasMixedPrintings: false,
        });

        return result;
      }, []);

      rendered_cards = groupedCards.map((entry) => (
        <CardResult
          card={entry.card}
          printing={entry.printing}
          chosenList={true}
          quantity={entry.quantity}
          hasMixedPrintings={entry.hasMixedPrintings}
          changeCardPrintingFromChosenCards={changeCardPrintingFromChosenCards}
          removeCardFromChosenCards={removeCardFromChosenCards}
        />
      ))
    } else {
      rendered_cards = cards.map((card) => <CardResult card={card} chosenList={false} addCardToChosenCards={addCardToChosenCards} />);
    }


    return (
      <CardListDiv>
        {rendered_cards}
      </CardListDiv>
    );
  }
}
