### Install
1. Install [PySyft](https://github.com/openmined/pysyft) in a separate environment.
2. Clone [PyGrid](https://github.com/openmined/pygrid) and `pip install .` to install requirements.
3. `cd pygrid/grid/ && python grid.py --host localhost --port 5001 --start_local_db` to start a PyGrid gateway.
4. Now, run the `Create Plan` notebook once, which will generate two files `cryptly_tp_full.pb` and `cryptly_model_params.pb`.
    - I have included the files, so you can skip it. ;)
5. Then run the `Host Plan.ipynb` to host the models on Grid.
6. Note: The  `model version` in `Host plan.ipynb` should match with the one entered in Extension Popup while pulling the model from grid. `model name = "Cryptly"` and `port = "localhost:5001"` are hardcoded in `background.js`.