const{ ApiPromise, WsProvider } = require('@polkadot/api');
const { isHex } = require('@polkadot/util');
const DOT_DECIMAL_PLACES = 1000000000000;
let display_nominators = true;

(async () => {
	const provider = new WsProvider('wss://kusama-rpc.polkadot.io/');
	const api = await ApiPromise.create({ provider });

	const [ currentValidators, totalIssuance ] = await Promise.all([
		api.query.session.validators(),
		api.query.balances.totalIssuance()
	]);

	const totalKSM = parseInt(totalIssuance.toString());
	let totalBondingStake = 0;
	let stakes = [];

	for (let i=0; i<currentValidators.length; i++) {
		const validatorTotalStake = await api.query.staking.stakers(currentValidators[i]);
		const validatorCommissioneRate = await api.query.staking.validators(currentValidators[i]);

		console.log(`Stash Address: ${currentValidators[i].toString()}`);
		console.log(`Self Stake: ${validatorTotalStake['own'].toString() / DOT_DECIMAL_PLACES}`);
		console.log(`Commission: ${validatorCommissioneRate[0]['validatorPayment'] / DOT_DECIMAL_PLACES} KSM`);
		console.log(`Nominators: ${validatorTotalStake['others'].length}\n`);

		// @ts-ignore
		if (display_nominators === true) {
			console.log(`Nominators`);
			for (let j=0; j<validatorTotalStake['others'].length; j++) {
				console.log(`Address: ${validatorTotalStake['others'][j]['who']},` +
					` Stake: ${validatorTotalStake['others'][j]['value'] / DOT_DECIMAL_PLACES}`
				);
			}
			console.log(` `);
		}

		console.log(`Validator total stake: ${validatorTotalStake['total'] / DOT_DECIMAL_PLACES} KSM\n`);
		stakes.push(validatorTotalStake['total'] / DOT_DECIMAL_PLACES);
		totalBondingStake += parseInt(validatorTotalStake['total']);

		console.log("#########################################################################\n");
	}

	console.log(`Total KSM: ${totalKSM / DOT_DECIMAL_PLACES}`);
	console.log(`Bonding Stake: ${totalBondingStake / DOT_DECIMAL_PLACES} KSM`);
	console.log(`Staking Rate: ${totalBondingStake / totalKSM * 100} %`);
	console.log(`Validators: ${currentValidators.length}`);
	console.log(`Minimum stake: ${Math.min.apply(null, stakes)}`);

	process.exit(0);
})()
