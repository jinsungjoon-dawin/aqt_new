<script>
    import TreeCRUDNode from "./TreeCRUDNode.svelte";

    // Same initial data as Tree.svelte for now
    let data = {
        CommHeader: {
            msg_len: 0,
            glob_id: "20240814180720426110004282383302",
            recv_svc_c: "NSBCO0755S02",
            rst_recv_svc_c: "NSBCO0755S02",
            rqst_resp_g: "R",
            chan_u: "A1",
            client_ip_no: "10.22.232.188",
            client_mac: "",
            grpco_c: "S001",
            msg_snd_msg_ilsi: "2024081418072042",
            sync_g: "S",
            eai_trx_g: 0,
            ttl_use_yn: 0,
            fst_sttim: "180720",
            keep_times: 0,
            snd_infc_g: 0,
            msg_snd_g: "2",
            trm_set_brno: 69,
            trm_set_trmno: 1188,
            trm_tong_no: 274,
            trxbrno: 1100,
            trx_trmno: 428,
            op_keyno: "333",
            op_hwnno: "22200576",
            bbk_prntr_link_g: "0",
            trm_recv_ga_yn: 0,
            aprvr_cnt: 0,
            aprvr_keyno1: "",
            aprvr_hwnno1: "",
            filler2: "",
            aprvr_keyno2: "",
            aprvr_hwnno2: "",
            filler3: "",
            mgaf_yn: 0,
            msg_u: 0,
            mach_set_grpco_c: "S001",
            scr_id: "8000200002",
            msg_hdr_mdia_ctnt: "00000010",
            target_svc_trx_c: "NSBCO0755S02",
            upmu_stt_c: 1,
            msg_wrt_lan_g: 1,
            trm_lock_yn: 0,
            snd_node_ctnt: "DBPX1",
            serv_mng_brno: 0,
            frnt_g: 0,
            trx_op_sosok_grpco_c: "S001",
            trx_aprvr_sosok_grpco_c1: "",
            trx_aprvr_sosok_grpco_c2: "",
            async_atrb: "0",
            form_occr_g: "",
            oprt_brno: 63,
            scr_prctc_mode: "",
            scr_prctc_snr_no: "",
            scr_prctc_action_no: "",
            std_msg_hdr_g: "10",
            out_msg_ilsi: "2024081418072054",
            rst_yn: 0,
            out_u: 1,
            msg_cont_no: 0,
            err_sys: "",
            err_kind: "",
            err_c: "",
            can_tryn: 0,
            crt_tryn: 0,
            hsong_tryn: 0,
            trx_k: 0,
            acmt_gjdt: "",
            opp_hwnno: "",
            telr_trxno: 0,
            telr_mg_yn: 0,
            snd_sys_g: "TMS",
            infc_ds_g: "",
            acmt_trxbrno: 0,
            brj_no: 0,
            trx_telrno: 0,
            nfcng_chan_user_msg_out_yn: 0,
            exrt_jkdt: "",
            nat_c: "",
            lcl_corp_c: 0,
            lang_c: "",
            ta_ynd_org_c: "",
            ta_ynd_upmu_c: "",
            cusno: 0,
            digital_mach_inf: "",
            next_infc_sys_g: 1,
            filler: "",
        },
        Message: {
            Cnt: 1,
            MessageData: [
                {
                    data_type: "98",
                    data_len: 0,
                    trx_c: "NSBCO0755S02",
                    screen_id: "8000200002",
                    form_cnt: 0,
                    msg_attr: "10001000",
                    err_field: null,
                    err_sub_info: null,
                    msg_cnt: 1,
                    msg_data: [
                        {
                            msg_content: "정상 처리되었습니다",
                        },
                    ],
                },
            ],
        },
        NSBCO0755S02_8000200002_O: {
            DataHeader: {
                data_type: "90",
                data_len: 0,
                trx_c: "NSBCO0755S02",
                screen_id: "8000200002",
                form_cnt: 0,
                form_list: [],
            },
            DataBody: {
                brNm: "영업부",
                telno: "**-****-****",
                girono: "0263009",
            },
        },
    };

    function save() {
        console.log("Saving JSON:", JSON.stringify(data, null, 2));
        alert("JSON saved to console (F12)");
    }

    function reset() {
        if (confirm("모든 변경사항을 초기화하시겠습니까? (새로고침됩니다)")) {
            location.reload();
        }
    }
</script>

<div class="container mx-auto p-4 lg:p-8 bg-gray-50 min-h-screen">
    <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl lg:text-3xl font-bold text-gray-700">
            Tree CRUD Editor
        </h2>
        <div class="space-x-2">
            <button
                on:click={reset}
                class="bg-transparent hover:bg-gray-500 text-gray-700 font-semibold hover:text-white px-3 py-1 text-sm rounded border border-gray-500 hover:border-transparent transition"
            >
                초기화
            </button>
            <button
                on:click={save}
                class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-1 text-sm rounded transition shadow"
            >
                저장 (Console)
            </button>
        </div>
    </div>

    <div
        class="bg-white shadow overflow-hidden border border-gray-300 p-4 rounded-lg"
    >
        <div class="font-mono">
            <TreeCRUDNode bind:value={data} isRoot={true} />
        </div>
    </div>
</div>
