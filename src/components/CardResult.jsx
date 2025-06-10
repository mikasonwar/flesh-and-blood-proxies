import { Component } from "preact";
import styled from "styled-components";

const CardDiv = styled.div`
  padding: 10px;
  display: flex;
  gap: 2px;
  flex-direction: column;
  img {
    height: 300px;

    @media print {
      border: dashed 2px black;
      height: 88mm;
      width: 63mm;
    }
    
    @media only screen and (max-width: 600px) {
      max-width: 100%;
      height: unset;
    }
  }

  @media print {
    gap: 0;
    padding: 0;
  }
`

const AddButton = styled.button.attrs({ className: 'no-print btn btn-success'})`
  padding: 5px;
  width: 100%;
  font-size: 18px;
`;

const RemoveButton = styled.button.attrs({ className: 'no-print btn btn-danger'})`
  padding: 5px;
  width: 100%;
  font-size: 18px;
`


export default class CardResult extends Component {
  render() {
    const { 
      card = {}, 
      printing = null,
      chosenList = false
    } = this.props;

    if (printing == null) {
      return card.printings.map((printing) => (<CardResult printing={printing} { ...this.props } />))
    }

    let action;

    if(chosenList) {
      action = (<RemoveButton onClick={() => this.props.removeCardFromChosenCards(card, printing)}> Remove </RemoveButton>)
    } else {
      action = (<AddButton onClick={() => this.props.addCardToChosenCards(card, printing)}> Add </AddButton>)
    }

    return (
      <CardDiv>
        <label class="no-print">{card.name}</label>
        <img src={printing.image_url} alt={card.name} />
        {action}
      </CardDiv>
    );
  }
}