export function setGuidesList(state, { list }) {
  state.list = list;
}

export function addGuide(state, { guide }) {
  state.list = [
    ...state.list,
    guide,
  ];
}

export function setGuideDetails(state, { guideDetails }) {
  state.guide_details = guideDetails;
}

export function setNewGuide(state, { newGuide }) {
  state.new_guide = newGuide;
}

export function favoriteClick(state, { index, favorite }) {
  state.list[index].favorite = favorite;
}

export function setEventDetail(state, { eventDetail }) {
  state.event_detail = eventDetail;
}

export function setReserveGuide(state, { reserve }) {
  state.reserve = reserve;
}

export function setClienteReserve(state, { clienteReserve }) {
  state.cliente_reserve = clienteReserve;
}

export function setNextGuides(state, { nextGuides }) {
  state.next_guides = nextGuides;
}
