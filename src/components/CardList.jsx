import { Component } from "preact";
import CardResult from "./CardResult";
import styled from "styled-components";

const CardListDiv = styled.div`
  margin: 5px 0;
  padding: 10px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  background-color: #ffffffdd;

  @media print {
    // gap: 0;
    gap: 5px;
  }

  @media only screen and (max-width: 600px) {
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
      chosenList = false
    } = this.props;

    let rendered_cards;
    if (chosenList) {
      rendered_cards = cards.map((entry, idx) => <CardResult card={entry.card} printing={entry.printing} chosenList={true} entryIndex={idx} changeCardPrintingFromChosenCards={changeCardPrintingFromChosenCards} removeCardFromChosenCards={removeCardFromChosenCards} />)
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