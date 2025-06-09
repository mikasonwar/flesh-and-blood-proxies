import { Component } from "preact";
import CardResult from "./CardResult";
import styled from "styled-components";

const CardListDiv = styled.div`
  margin: 5px 0;
  padding: 10px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  background-color: #ffffffaa;

  @media print {
    gap: 0;
  }
`

export default class CardList extends Component {
  render() {
    const { 
      cards = [],
      addCardToChosenCards = null,
      removeCardFromChosenCards = null,
      chosenList = false
    } = this.props;

    let rendered_cards;
    if (chosenList) {
      rendered_cards = cards.map((entry) => <CardResult card={entry.card} printing={entry.printing} chosenList={true} removeCardFromChosenCards={removeCardFromChosenCards} />)
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